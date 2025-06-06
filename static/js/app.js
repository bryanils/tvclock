document.addEventListener("DOMContentLoaded", () => {
  const videoPlayer = document.getElementById("background-video");
  const timeDisplay = document.getElementById("current-time");

  if (!videoPlayer || !timeDisplay) {
    console.error('Required elements not found!');
    return;
  }

  // Function to update the clock
  function updateClock() {
    const now = new Date();
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    timeDisplay.textContent = now.toLocaleTimeString(undefined, options);
  }

  // Update clock every second
  setInterval(updateClock, 1000);
  updateClock();

  // Function to get a new random video
  async function getRandomVideoPath() {
    try {
      const response = await fetch("/next-video");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.videoPath;
    } catch (error) {
      console.error("Error fetching next video:", error);
      return videoPlayer.src;
    }
  }

  let isTransitioning = false;
  let fadeOutStarted = false;

  // Make sure video doesn't loop
  videoPlayer.loop = false;

  // Function to switch to next video
  async function switchToNextVideo() {
    if (isTransitioning) return;
    isTransitioning = true;
    
    // Fade out current video
    videoPlayer.style.opacity = '0';
    
    // Wait for fade out to complete, then switch video
    setTimeout(async () => {
      const nextVideoPath = await getRandomVideoPath();
      
      // Create a promise that resolves when the video is ready to play
      const videoReady = new Promise((resolve) => {
        const onCanPlay = () => {
          videoPlayer.removeEventListener('canplay', onCanPlay);
          videoPlayer.removeEventListener('loadeddata', onCanPlay);
          resolve();
        };
        videoPlayer.addEventListener('canplay', onCanPlay);
        videoPlayer.addEventListener('loadeddata', onCanPlay);
      });
      
      // Load the new video
      videoPlayer.src = nextVideoPath;
      videoPlayer.load();
      
      // Wait for video to be ready, then play and fade in
      await videoReady;
      
      try {
        await videoPlayer.play();
        // Small delay to ensure video is actually playing
        setTimeout(() => {
          videoPlayer.style.opacity = '1';
          isTransitioning = false;
          fadeOutStarted = false;
        }, 100);
        
      } catch (error) {
        console.error('Error playing video:', error);
        videoPlayer.style.opacity = '1';
        isTransitioning = false;
        fadeOutStarted = false;
      }
    }, 1000);
  }

  // Monitor video time to start fade out in the last 5 seconds
  videoPlayer.addEventListener('timeupdate', () => {
    if (isTransitioning || fadeOutStarted) return;
    
    const timeLeft = videoPlayer.duration - videoPlayer.currentTime;
    
    // Start fade out 1 second before video ends
    if (timeLeft <= 1 && timeLeft > 0) {
      fadeOutStarted = true;
      switchToNextVideo();
    }
  });

  // Backup: handle video ending in case timeupdate doesn't catch it
  videoPlayer.addEventListener("ended", () => {
    if (!isTransitioning) {
      switchToNextVideo();
    }
  });

  // Initialize first video
  videoPlayer.style.opacity = '0';
  
  // Wait for first video to be ready
  const initVideo = () => {
    videoPlayer.play().then(() => {
      setTimeout(() => {
        videoPlayer.style.opacity = '1';
      }, 100);
    }).catch((e) => {
      videoPlayer.style.opacity = '1';
    });
  };

  if (videoPlayer.readyState >= 3) {
    // Video is already ready
    initVideo();
  } else {
    // Wait for video to be ready
    videoPlayer.addEventListener('canplay', function onFirstCanPlay() {
      videoPlayer.removeEventListener('canplay', onFirstCanPlay);
      initVideo();
    });
  }
});
