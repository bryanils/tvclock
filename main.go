package main

import (
	"embed"
	"encoding/json"
	"io/fs"
	"log"
	"math/rand"
	"net/http"
	"path/filepath"

	"github.com/bryanils/tvclock/templates"
)

//go:embed vids
var videoFS embed.FS

//go:embed static
var staticFS embed.FS

var videoPaths []string
var lastVideoIndex = -1

func init() {
	// Discover video files at startup
	err := filepath.WalkDir("vids", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() && (filepath.Ext(path) == ".mp4") { // Add more extensions if needed
			// Convert backslashes to forward slashes for web URLs
			webPath := filepath.ToSlash(path)
			videoPaths = append(videoPaths, "/"+webPath) // Serve path as /vids/video.mp4
		}
		return nil
	})

	if err != nil {
		log.Fatalf("Error walking video directory: %v", err)
	}
	if len(videoPaths) == 0 {
		log.Fatalf("No .mp4 videos found in 'vids' directory. Please add some.")
	}

	log.Printf("Found %d videos:", len(videoPaths))
	for _, p := range videoPaths {
		log.Printf("- %s", p)
	}
}

func main() {
	// Serve static files from the 'static' directory
	staticContent, err := fs.Sub(staticFS, "static")
	if err != nil {
		log.Fatalf("failed to create sub filesystem for static: %v", err)
	}
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.FS(staticContent))))

	// Serve video files from the 'vids' directory
	videoContent, err := fs.Sub(videoFS, "vids")
	if err != nil {
		log.Fatalf("failed to create sub filesystem for videos: %v", err)
	}
	http.Handle("/vids/", http.StripPrefix("/vids/", http.FileServer(http.FS(videoContent))))

	// Main page handler
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		// Pick an initial random video
		initialVideo := ""
		if len(videoPaths) > 0 {
			initialVideo = videoPaths[rand.Intn(len(videoPaths))]
		} else {
			log.Println("Warning: No videos found to display initially.")
		}
		templates.ClockPage(initialVideo).Render(r.Context(), w)
	})

	// API endpoint to get the next random video path
	http.HandleFunc("/next-video", func(w http.ResponseWriter, r *http.Request) {
		if len(videoPaths) == 0 {
			http.Error(w, "No videos available", http.StatusNotFound)
			return
		}

		var randomIndex int
		// If we have more than one video, avoid repeating the last one
		if len(videoPaths) > 1 {
			for {
				randomIndex = rand.Intn(len(videoPaths))
				if randomIndex != lastVideoIndex {
					break
				}
			}
		} else {
			randomIndex = 0
		}

		lastVideoIndex = randomIndex
		nextVideo := videoPaths[randomIndex]

		//log.Printf("Serving next video: %s (index %d)", nextVideo, randomIndex)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"videoPath": nextVideo})
	})

	port := ":8080"
	log.Printf("Server starting on http://localhost%s", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
