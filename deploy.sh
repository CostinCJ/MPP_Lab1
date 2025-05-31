#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Configuration -
AWS_REGION="eu-central-1"
ECR_REPOSITORY_URI="013249835197.dkr.ecr.eu-central-1.amazonaws.com/string_tracker"
LOCAL_IMAGE_NAME="mpp_lab1-app"
ECS_CLUSTER_NAME="string-tracker-cluster"
ECS_SERVICE_NAME="string-tracker-services"

# --- Script Start ---
echo "Starting deployment script..."

# 1. Authenticate Docker to ECR
echo "Authenticating Docker to ECR..."
AWS_CMD="aws"
if ! command -v aws &> /dev/null
then
    if command -v aws.exe &> /dev/null
    then
        AWS_CMD="aws.exe"
    else
        echo "ERROR: aws and aws.exe command not found. Please ensure AWS CLI is installed and in PATH."
        exit 1
    fi
fi

"${AWS_CMD}" ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ECR_REPOSITORY_URI}"
echo "ECR login successful."

# 2. Build the Docker image using Docker Compose
echo "Building Docker image with Docker Compose..."
docker-compose build app --no-cache
echo "Docker image built successfully."

# 3. Tag the local image for ECR
IMAGE_TAG="latest"
ECR_IMAGE_URI_WITH_TAG="${ECR_REPOSITORY_URI}:${IMAGE_TAG}"

echo "Tagging image ${LOCAL_IMAGE_NAME}:${IMAGE_TAG} for ECR as ${ECR_IMAGE_URI_WITH_TAG}..."
docker tag "${LOCAL_IMAGE_NAME}:${IMAGE_TAG}" "${ECR_IMAGE_URI_WITH_TAG}"
echo "Image tagged successfully."

# 4. Push the image to ECR
echo "Pushing image ${ECR_IMAGE_URI_WITH_TAG} to ECR..."
docker push "${ECR_IMAGE_URI_WITH_TAG}"
echo "Image pushed to ECR successfully."

# 5. Force a new deployment of the ECS service
echo "Updating ECS service ${ECS_SERVICE_NAME} in cluster ${ECS_CLUSTER_NAME} to force new deployment..."
"${AWS_CMD}" ecs update-service \
  --cluster "${ECS_CLUSTER_NAME}" \
  --service "${ECS_SERVICE_NAME}" \
  --force-new-deployment \
  --region "${AWS_REGION}"
echo "ECS service update initiated."
echo "Waiting for the service deployment to stabilize (this might take several minutes)..."
if ! "${AWS_CMD}" ecs wait services-stable --cluster "${ECS_CLUSTER_NAME}" --services "${ECS_SERVICE_NAME}" --region "${AWS_REGION}"; then
    echo "ERROR: Service did not stabilize. Please check the ECS console for errors."
    exit 1
fi
echo "Service deployment is stable."

echo "Fetching Public IP of the new task..."

TASK_ARN=$( "${AWS_CMD}" ecs list-tasks --cluster "${ECS_CLUSTER_NAME}" --service-name "${ECS_SERVICE_NAME}" --desired-status RUNNING --region "${AWS_REGION}" --query "taskArns[0]" --output text | tr -d '[:space:]' )

if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" == "None" ] || [ "$TASK_ARN" == "null" ]; then # Added check for "null" string
    echo "ERROR: Could not find a running task for service ${ECS_SERVICE_NAME}."
    exit 1
fi
echo "Found running task ARN: ${TASK_ARN}"

ENI_ID_RAW=$("${AWS_CMD}" ecs describe-tasks --cluster "${ECS_CLUSTER_NAME}" --tasks "${TASK_ARN}" --region "${AWS_REGION}" --query "tasks[0].attachments[0].details[?name=='networkInterfaceId'].value | [0]" --output text)
ENI_ID=$(echo "${ENI_ID_RAW}" | tr -d '\n\r[:space:]') 

if [ -z "$ENI_ID" ] || [ "$ENI_ID" == "None" ] || [ "$ENI_ID" == "null" ]; then
    echo "ERROR: Could not find Network Interface ID for task ${TASK_ARN} (Raw value: '${ENI_ID_RAW}')."
    exit 1
fi
echo "Found ENI ID: ${ENI_ID}"

# Describe the Network Interface to get the Public IP
PUBLIC_IP_RAW=$("${AWS_CMD}" ec2 describe-network-interfaces --network-interface-ids "${ENI_ID}" --region "${AWS_REGION}" --query "NetworkInterfaces[0].Association.PublicIp" --output text)
PUBLIC_IP=$(echo "${PUBLIC_IP_RAW}" | tr -d '\n\r[:space:]')

if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" == "None" ]; then
    echo "ERROR: Could not find Public IP for ENI ${ENI_ID}."
    echo "This might happen if the task is still initializing or if 'assignPublicIp' was not ENABLED."
    exit 1
fi

echo "---------------------------------------------------------------------"
echo "Deployment script finished."
echo "Application successfully deployed."
echo "Access your application at: https://string-tracker-inventory.online"
echo "---------------------------------------------------------------------"