# Simple Makefile for TV Clock Go Application

# Variables
BINARY_NAME=tvclock
SERVER_USER=bryane
SERVER_HOST=it.ileadserve.com
SERVER_PATH=/tmp

# Default target
all: build

# Build for current platform
build:
	go build -o $(BINARY_NAME).exe

# Build for Linux (server deployment)
build-linux:
	GOOS=linux GOARCH=amd64 go build -o $(BINARY_NAME)

# Deploy to server
deploy: build-linux
	scp $(BINARY_NAME) $(SERVER_USER)@$(SERVER_HOST):$(SERVER_PATH)/

# Clean build artifacts
clean:
	rm -f $(BINARY_NAME)

# Run locally for testing
run: build
	./$(BINARY_NAME)

# Build and run
dev: build run

# Show help
help:
	@echo "Available targets:"
	@echo "  build       - Build for current platform"
	@echo "  build-linux - Build for Linux (server deployment)"
	@echo "  deploy      - Build for Linux and deploy to server"
	@echo "  clean       - Remove build artifacts"
	@echo "  run         - Build and run locally"
	@echo "  dev         - Build and run (alias for run)"
	@echo "  help        - Show this help"

.PHONY: all build build-linux deploy clean run dev help