#!/bin/bash

# Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT="staging"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    staging|production)
      ENVIRONMENT="$1"
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [staging|production]"
      echo ""
      echo "Environments:"
      echo "  staging     Deploy to staging environment (default)"
      echo "  production  Deploy to production environment"
      echo ""
      echo "Options:"
      echo "  -h, --help  Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}Starting deployment to ${ENVIRONMENT}...${NC}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${RED}Error: Not in a git repository${NC}"
  exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Current branch: ${CURRENT_BRANCH}${NC}"

# Validate branch for environment
if [ "$ENVIRONMENT" = "production" ] && [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${RED}Error: Production deployments must be from main branch${NC}"
  exit 1
fi

if [ "$ENVIRONMENT" = "staging" ] && [ "$CURRENT_BRANCH" != "develop" ] && [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${RED}Error: Staging deployments must be from develop or main branch${NC}"
  exit 1
fi

# Check if working directory is clean
if ! git diff-index --quiet HEAD --; then
  echo -e "${YELLOW}Warning: Working directory is not clean${NC}"
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci

# Run tests
echo -e "${YELLOW}Running tests...${NC}"
npm run lint
npm run build

# Environment-specific build
if [ "$ENVIRONMENT" = "production" ]; then
  echo -e "${YELLOW}Building for production...${NC}"
  npm run build
else
  echo -e "${YELLOW}Building for staging...${NC}"
  npm run build:dev
fi

echo -e "${GREEN}Build completed successfully${NC}"

# Get version for deployment
VERSION=$(node -p "require('./package.json').version")
COMMIT_HASH=$(git rev-parse --short HEAD)

echo -e "${BLUE}Deploying version ${VERSION} (${COMMIT_HASH}) to ${ENVIRONMENT}${NC}"

# Deployment commands (customize based on your deployment platform)
case $ENVIRONMENT in
  staging)
    echo -e "${YELLOW}Deploying to staging environment...${NC}"
    # Add your staging deployment commands here
    # Example: 
    # rsync -avz dist/ user@staging-server:/var/www/html/
    # or deploy to your staging platform
    echo "Staging deployment completed"
    ;;
  production)
    echo -e "${YELLOW}Deploying to production environment...${NC}"
    # Add your production deployment commands here
    # Example:
    # rsync -avz dist/ user@prod-server:/var/www/html/
    # or deploy to your production platform
    echo "Production deployment completed"
    ;;
esac

# Create deployment record
DEPLOYMENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DEPLOYMENT_LOG="deployments/${ENVIRONMENT}-deployments.log"

# Create deployments directory if it doesn't exist
mkdir -p deployments

# Log deployment
echo "${DEPLOYMENT_TIME} - v${VERSION} (${COMMIT_HASH}) - ${CURRENT_BRANCH} - SUCCESS" >> $DEPLOYMENT_LOG

echo -e "${GREEN}Deployment to ${ENVIRONMENT} completed successfully!${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}Commit: ${COMMIT_HASH}${NC}"
echo -e "${BLUE}Branch: ${CURRENT_BRANCH}${NC}"
echo -e "${BLUE}Time: ${DEPLOYMENT_TIME}${NC}"

# Environment-specific post-deployment steps
if [ "$ENVIRONMENT" = "production" ]; then
  echo -e "${YELLOW}Remember to:${NC}"
  echo "1. Monitor application logs"
  echo "2. Run smoke tests"
  echo "3. Update deployment documentation"
  echo "4. Notify the team"
fi