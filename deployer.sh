echo "Starting deploy script..."
set -e

CONTAINER_NAME="aethereal-funding"
echo "Container name set to $CONTAINER_NAME"

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

# Run the container
docker run -d --name $CONTAINER_NAME -p 5000:5000 --env-file .env $CONTAINER_NAME
echo "Container started successfully on port 5000."
