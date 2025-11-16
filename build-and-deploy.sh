#!/bin/bash

echo "🔧 Installing dependencies and building..."

# Install dependencies
pnpm install

# Run build and capture output
echo "🏗️  Building project..."
pnpm build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Commit changes
    echo "📝 Committing changes..."
    git add -A
    git commit -m "feat: Migrate to MongoDB and add React Native mobile app

- Replaced Supabase with MongoDB for data persistence
- Added mongodb driver and service layer
- Created MongoDB models for users, research_runs, projects
- Implemented complete CRUD operations with indexes
- Added React Native Expo mobile application
- Created mobile screens for research form and results
- Added mobile data visualization with charts
- Updated documentation with MongoDB guide
- Updated Docker Compose with MongoDB service
- Fixed all TypeScript compilation errors
- Production-ready for Vercel deployment

Breaking changes:
- Requires MongoDB URI instead of Supabase credentials
- New mobile app in mobile-app/ directory
- Updated environment variable names"
    
    echo "🚀 Pushing to GitHub..."
    git push origin main
    
    echo ""
    echo "✅ Done! Vercel will auto-deploy."
else
    echo "❌ Build failed. Check errors above."
    exit 1
fi
