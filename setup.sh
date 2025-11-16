#!/bin/bash

# Kivo Setup Script - MongoDB & Mobile App Edition

set -e

echo "🚀 Setting up Kivo with MongoDB and Mobile App"
echo "================================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm not found. Installing pnpm..."
    npm install -g pnpm
fi
echo "✅ pnpm $(pnpm --version)"

# Check MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found."
    echo "   Please install MongoDB:"
    echo "   - macOS: brew install mongodb-community"
    echo "   - Linux: sudo apt-get install mongodb"
    echo "   - Windows: Download from https://www.mongodb.com/try/download/community"
    echo ""
    read -p "Do you want to continue without local MongoDB? (You can use MongoDB Atlas) [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ MongoDB $(mongod --version | head -n 1)"
fi

# Check Redis (optional)
if ! command -v redis-server &> /dev/null; then
    echo "⚠️  Redis not found (optional - for caching)"
    echo "   Install with: brew install redis (macOS) or apt-get install redis (Linux)"
else
    echo "✅ Redis $(redis-server --version)"
fi

echo ""
echo "📦 Installing dependencies..."

# Install web app dependencies
echo "Installing web app dependencies..."
pnpm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo ""
    echo "📝 Creating .env.local file..."
    cat > .env.local << 'EOF'
# MongoDB
MONGODB_URI=mongodb://localhost:27017/kivo
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/kivo?retryWrites=true&w=majority

# Redis (optional - for caching)
REDIS_URL=redis://localhost:6379

# XAI API (for research)
XAI_API_KEY=your_xai_api_key_here

# NextAuth (optional)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_secret_here
EOF
    echo "✅ Created .env.local"
    echo "⚠️  Please update MONGODB_URI and XAI_API_KEY in .env.local"
fi

echo ""
read -p "Do you want to install mobile app dependencies? [Y/n] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    # Install mobile app dependencies
    echo "Installing mobile app dependencies..."
    cd mobile-app
    pnpm install
    cd ..
    echo "✅ Mobile app dependencies installed"
fi

echo ""
echo "================================================"
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo ""
echo "1. Start MongoDB:"
echo "   brew services start mongodb-community  # macOS"
echo "   sudo systemctl start mongod            # Linux"
echo "   mongod                                 # Manual start"
echo ""
echo "2. (Optional) Start Redis:"
echo "   redis-server"
echo ""
echo "3. Update .env.local with your configuration"
echo ""
echo "4. Start the web app:"
echo "   pnpm dev"
echo "   Open http://localhost:3000"
echo ""
echo "5. (Optional) Start the mobile app:"
echo "   cd mobile-app"
echo "   pnpm start"
echo ""
echo "📖 Documentation:"
echo "   - Main README: README.md"
echo "   - MongoDB Guide: MONGODB_GUIDE.md"
echo "   - Mobile App: mobile-app/README.md"
echo "   - Migration Info: MIGRATION.md"
echo ""
echo "🐳 Or use Docker to start everything:"
echo "   docker-compose up -d"
echo ""
echo "Happy coding! 🎉"
