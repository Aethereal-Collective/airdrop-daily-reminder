#!/bin/bash

echo "Starting deploy script..."
set -e

CONTAINER_NAME="aethereal-daily-reminder"
APP_DIR="$(pwd)"  # Current directory
echo "Container name set to $CONTAINER_NAME"
echo "App directory set to $APP_DIR"

# Load environment variables
export $(grep -v '^#' .env | xargs)
echo "Environment variables loaded."

# Build the Docker image
docker build -t $CONTAINER_NAME .
echo "Docker image built."

# Stop and remove any existing container with the same name
docker stop $CONTAINER_NAME || true
echo "Stopped existing container (if any)."
docker rm $CONTAINER_NAME || true
echo "Removed existing container (if any)."

# Ensure DB file exists
touch reminders.db

# Run the container with only the DB mounted
docker run -d \
  --name $CONTAINER_NAME \
  -p 5005:5005 \
  --env-file .env \
  -v "$APP_DIR/reminders.db:/app/reminders.db" \
  $CONTAINER_NAME


echo "Container started successfully on port 5005 with volume mounted."
