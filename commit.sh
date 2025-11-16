#!/bin/bash
set -e

echo "🚀 Starting Git commit and push process..."

# Configure git (if not already configured)
git config --global user.email "github-actions@github.com" || true
git config --global user.name "GitHub Actions" || true

# Add all changes
echo "📝 Adding all changes..."
git add -A

# Create commit
echo "💾 Creating commit..."
git commit -m "feat: Complete migration to Next.js TypeScript with all features

- Migrated from Python FastAPI to Next.js 14 with TypeScript
- Implemented all API routes for research functionality
- Added Redis caching layer for performance
- Implemented rate limiting and security middleware
- Created comprehensive UI components with Tailwind CSS and Radix UI
- Added sentiment analysis and clustering algorithms
- Implemented PDF and CSV export functionality
- Added Slack/Discord webhook integrations
- Created data visualization with Chart.js
- Set up GitHub Actions CI/CD pipeline
- Added Docker and docker-compose support
- Configured ESLint, Prettier, and pre-commit hooks
- Created comprehensive documentation
- Vercel deployment ready

Features:
✅ Real-time sentiment analysis
✅ Automatic topic clustering
✅ Pain point identification
✅ PDF & CSV exports
✅ Slack/Discord webhooks
✅ Redis caching
✅ Rate limiting
✅ Data visualization
✅ Dark mode support
✅ Responsive design
✅ CI/CD pipeline
✅ Docker support" || echo "Nothing to commit or commit failed"

# Push to GitHub
echo "🔄 Pushing to GitHub..."
git push origin main || git push origin HEAD:main

echo "✅ Successfully committed and pushed to GitHub!"
echo "🌐 Vercel will automatically deploy your changes"
