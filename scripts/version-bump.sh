#!/bin/bash

# Version Bump Script
# Usage: ./scripts/version-bump.sh [patch|minor|major] [--prerelease]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
VERSION_TYPE="patch"
PRERELEASE=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    patch|minor|major)
      VERSION_TYPE="$1"
      shift
      ;;
    --prerelease)
      PRERELEASE=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [patch|minor|major] [--prerelease] [--dry-run]"
      echo ""
      echo "Options:"
      echo "  patch       Bump patch version (default)"
      echo "  minor       Bump minor version"
      echo "  major       Bump major version"
      echo "  --prerelease Create a prerelease version"
      echo "  --dry-run   Show what would be done without making changes"
      echo "  -h, --help  Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${RED}Error: Not in a git repository${NC}"
  exit 1
fi

# Check if working directory is clean
if ! git diff-index --quiet HEAD --; then
  echo -e "${RED}Error: Working directory is not clean. Please commit or stash your changes.${NC}"
  exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}Current version: ${CURRENT_VERSION}${NC}"

# Calculate new version
if [ "$PRERELEASE" = true ]; then
  if [ "$DRY_RUN" = true ]; then
    NEW_VERSION=$(npm version pre${VERSION_TYPE} --preid=beta --no-git-tag-version --dry-run | sed 's/v//')
  else
    NEW_VERSION=$(npm version pre${VERSION_TYPE} --preid=beta --no-git-tag-version | sed 's/v//')
  fi
else
  if [ "$DRY_RUN" = true ]; then
    NEW_VERSION=$(npm version ${VERSION_TYPE} --no-git-tag-version --dry-run | sed 's/v//')
  else
    NEW_VERSION=$(npm version ${VERSION_TYPE} --no-git-tag-version | sed 's/v//')
  fi
fi

echo -e "${GREEN}New version: ${NEW_VERSION}${NC}"

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}Dry run mode - no changes made${NC}"
  exit 0
fi

# Update package.json (already done by npm version)
echo -e "${YELLOW}Updated package.json${NC}"

# Generate changelog entry
echo -e "${YELLOW}Generating changelog entry...${NC}"

CHANGELOG_ENTRY="## [${NEW_VERSION}] - $(date +%Y-%m-%d)

### Added
- 

### Changed
- 

### Fixed
- 

"

# Create backup of CHANGELOG.md
cp CHANGELOG.md CHANGELOG.md.bak

# Insert new entry after the "## [Unreleased]" section
sed "/## \[Unreleased\]/r /dev/stdin" CHANGELOG.md.bak > CHANGELOG.md << EOF

$CHANGELOG_ENTRY
EOF

echo -e "${GREEN}Updated CHANGELOG.md${NC}"

# Stage changes
git add package.json CHANGELOG.md

# Commit changes
git commit -m "chore: bump version to v${NEW_VERSION}"

# Create tag
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"

echo -e "${GREEN}Created commit and tag for v${NEW_VERSION}${NC}"
echo -e "${YELLOW}Run 'git push origin main --tags' to push changes and trigger release${NC}"

# Ask if user wants to push
read -p "Do you want to push the changes now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  git push origin main --tags
  echo -e "${GREEN}Changes pushed successfully${NC}"
else
  echo -e "${YELLOW}Changes committed locally. Don't forget to push later!${NC}"
fi