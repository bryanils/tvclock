document.addEventListener("DOMContentLoaded", () => {
  const videoPlayer = document.getElementById("background-video");
  const timeDisplay = document.getElementById("current-time");

  console.log('App.js loaded successfully');
  console.log('Video element found:', !!videoPlayer);
  console.log('Time display found:', !!timeDisplay);

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
      console.log('Fetching next video...');
      const response = await fetch("/next-video");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Got next video:', data.videoPath);
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
    
    console.log('Switching to next video...');
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
        console.log('New video playing, fading in...');
        
        // Small delay to ensure video is actually playing
        setTimeout(() => {
          videoPlayer.style.opacity = '1';
          isTransitioning = false;
          fadeOutStarted = false;
          console.log('Fade in complete');
        }, 100);
        
      } catch (error) {
        console.error('Error playing video:', error);
        videoPlayer.style.opacity = '1';
        isTransitioning = false;
        fadeOutStarted = false;
      }
    }, 4000); // Wait for 4 second fade out
  }

  // Monitor video time to start fade out in the last 5 seconds
  videoPlayer.addEventListener('timeupdate', () => {
    if (isTransitioning || fadeOutStarted) return;
    
    const timeLeft = videoPlayer.duration - videoPlayer.currentTime;
    
    // Start fade out 5 seconds before video ends
    if (timeLeft <= 5 && timeLeft > 0) {
      fadeOutStarted = true;
      console.log('Starting fade out with', timeLeft.toFixed(2), 'seconds left');
      switchToNextVideo();
    }
  });

  // Backup: handle video ending in case timeupdate doesn't catch it
  videoPlayer.addEventListener("ended", () => {
    console.log('Video ended event fired');
    if (!isTransitioning) {
      switchToNextVideo();
    }
  });

  // Initialize first video
  console.log('Initializing first video...');
  videoPlayer.style.opacity = '0';
  
  // Wait for first video to be ready
  const initVideo = () => {
    videoPlayer.play().then(() => {
      console.log('First video playing, fading in...');
      setTimeout(() => {
        videoPlayer.style.opacity = '1';
        console.log('Initial fade in complete');
      }, 100);
    }).catch((e) => {
      console.warn("Autoplay was prevented:", e);
      // Still fade in even if autoplay fails
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
