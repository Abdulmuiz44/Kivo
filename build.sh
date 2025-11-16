#!/bin/bash
set -e

echo "Starting build process..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  pnpm install
fi

# Run type check
echo "Running type check..."
pnpm type-check || true

# Run lint
echo "Running linter..."
pnpm lint || true

# Build the application
echo "Building Next.js application..."
pnpm build

echo "Build completed successfully!"
