document.addEventListener("DOMContentLoaded", () => {
  const videoPlayer = document.getElementById("background-video");
  const timeDisplay = document.getElementById("current-time");

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

  // Monitor video time to fade out in the last second
  videoPlayer.addEventListener('timeupdate', () => {
    if (isTransitioning) return;
    
    const timeLeft = videoPlayer.duration - videoPlayer.currentTime;
    
    // Start fade out 1 second before video ends
    if (timeLeft <= 1 && timeLeft > 0) {
      isTransitioning = true;
      videoPlayer.classList.add('fade-out');
    }
  });

  // Handle video ending - switch and fade in
  videoPlayer.addEventListener("ended", async () => {
    const nextVideoPath = await getRandomVideoPath();
    videoPlayer.src = nextVideoPath;
    videoPlayer.load();
    
    // When new video is ready, play and fade in
    videoPlayer.addEventListener('canplay', function onCanPlay() {
      videoPlayer.removeEventListener('canplay', onCanPlay);
      videoPlayer.play().then(() => {
        // Remove fade-out and add fade-in for smooth transition
        videoPlayer.classList.remove('fade-out');
        videoPlayer.classList.add('fade-in');
        isTransitioning = false;
      }).catch((e) => {
        console.error("Error playing next video:", e);
        videoPlayer.classList.remove('fade-out');
        videoPlayer.classList.add('fade-in');
        isTransitioning = false;
      });
    });
  });

  // Handle cases where autoplay might be blocked
  videoPlayer.play().catch((e) => {
    console.warn("Autoplay was prevented:", e);
  });
});
