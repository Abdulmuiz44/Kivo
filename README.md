# Kivo

**AI-Powered Social Media Research Assistant** 🔍

Kivo is a full-stack TypeScript application that analyzes social media conversations from Reddit and Twitter/X to identify pain points, sentiment trends, and actionable insights. Built with Next.js 14, MongoDB, and React Native Expo.

## ✨ Features

- **🤖 AI Research Pipeline**: Automated sentiment analysis, topic clustering, and keyword extraction
- **📊 Data Visualization**: Interactive charts and graphs for sentiment distribution
- **💾 MongoDB Storage**: Persistent data storage with flexible document schema
- **🚀 Real-time Updates**: Live progress tracking during research processing
- **📱 Mobile App**: Native iOS/Android app built with React Native Expo
- **📤 Export Options**: Download results as PDF or CSV
- **🔔 Webhook Integration**: Slack/Discord notifications for completed research
- **⚡ Redis Caching**: Optional caching layer for improved performance
- **🎨 Modern UI**: Beautiful, responsive interface with Tailwind CSS and dark mode

## 🏗️ Project Structure

```
Kivo/
├── src/                      # Next.js application
│   ├── app/                  # App Router pages and API routes
│   │   ├── api/              # Backend API endpoints
│   │   │   ├── research/     # Research CRUD operations
│   │   │   └── integrations/ # Webhooks
│   │   ├── research/[runId]/ # Research results page
│   │   └── page.tsx          # Home page
│   ├── components/           # React components
│   ├── lib/                  # Utilities and services
│   │   ├── mongodb.ts        # MongoDB connection
│   │   ├── mongodb-service.ts # Database operations
│   │   ├── research-pipeline.ts # NLP and analysis
│   │   └── redis.ts          # Caching layer
│   └── types/                # TypeScript definitions
├── mobile-app/               # React Native Expo mobile app
│   ├── app/                  # Mobile screens
│   │   ├── index.tsx         # Research form
│   │   └── research/[id].tsx # Results screen
│   ├── app.json              # Expo configuration
│   └── package.json          # Mobile dependencies
├── backend/                  # Legacy Python backend (deprecated)
├── supabase/                 # Legacy Supabase functions (deprecated)
└── docker-compose.yml        # Docker services (MongoDB, Redis, Next.js)
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **pnpm**
- **MongoDB** (local or Atlas)
- **Redis** (optional, for caching)
- **Expo CLI** (for mobile app)

### Installation

```bash
# Clone the repository
git clone https://github.com/Abdulmuiz44/Kivo.git
cd Kivo

# Install web app dependencies
pnpm install

# Install mobile app dependencies (optional)
cd mobile-app
pnpm install
cd ..
```

### Environment Setup

Create `.env.local` file:

```bash
# MongoDB (required)
MONGODB_URI=mongodb://localhost:27017/kivo
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/kivo

# Redis (optional - for caching)
REDIS_URL=redis://localhost:6379

# XAI API (for research)
XAI_API_KEY=your_xai_api_key_here

# NextAuth (optional - for authentication)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
```

### Running with Docker (Recommended)

```bash
# Start all services (MongoDB, Redis, Next.js)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The app will be available at http://localhost:3000

### Running Locally

```bash
# Start MongoDB (if not using Docker)
mongod --dbpath /path/to/data

# Start Redis (optional)
redis-server

# Start Next.js development server
pnpm dev
```

### Running Mobile App

```bash
cd mobile-app

# Start Expo development server
pnpm start

# Run on iOS Simulator
pnpm ios

# Run on Android Emulator
pnpm android
```

See [mobile-app/README.md](mobile-app/README.md) for detailed mobile setup instructions.

## 📖 Usage

### Web App

1. Open http://localhost:3000
2. Enter a research topic (e.g., "Freelancer invoicing pain points")
3. Add query terms (optional, comma-separated)
4. Select data sources (Reddit, Twitter/X)
5. Click "Start Research"
6. View real-time progress and results
7. Export data as PDF or CSV

### Mobile App

1. Launch the app on your device or simulator
2. Fill in the research form
3. Track progress in real-time
4. View sentiment charts and pain points
5. Export or share results

## 🗄️ MongoDB Setup

### Local MongoDB

```bash
# Install MongoDB
brew install mongodb-community  # macOS
# or download from https://www.mongodb.com/try/download/community

# Start MongoDB
brew services start mongodb-community

# Verify connection
mongosh
```

### MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env.local`

### Initialize Indexes

Indexes are automatically created on first run. To manually initialize:

```typescript
import { initializeIndexes } from '@/lib/mongodb-service';
await initializeIndexes();
```

## 🔧 API Endpoints

### Research API

- `POST /api/research/run` - Start new research
- `GET /api/research/[runId]/status` - Get research status
- `GET /api/research/[runId]/payload` - Get complete results
- `GET /api/research/[runId]/summary` - Get summary only
- `GET /api/research/[runId]/export/pdf` - Export as PDF
- `GET /api/research/[runId]/export/csv` - Export as CSV

### Webhooks

- `POST /api/integrations/webhook` - Send to Slack/Discord

## 🛠️ Development

```bash
# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
pnpm lint:fix

# Format code
pnpm format

# Type checking
pnpm type-check

# Run tests
pnpm test
```

## 📦 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables:
   - `MONGODB_URI`
   - `REDIS_URL` (optional)
   - `XAI_API_KEY`
4. Deploy!

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Docker Production

```bash
# Build and run production image
docker build -t kivo .
docker run -p 3000:3000 --env-file .env.local kivo
```

## 🧪 Tech Stack

### Web App

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **MongoDB** - NoSQL database
- **Redis** - Caching layer
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible components
- **Chart.js** - Data visualization
- **Natural** - NLP library
- **Sentiment** - Sentiment analysis
- **jsPDF** - PDF generation
- **PapaParse** - CSV export

### Mobile App

- **React Native** - Native mobile framework
- **Expo** - Development platform
- **Expo Router** - File-based routing
- **React Native Chart Kit** - Charts
- **Axios** - HTTP client

### Infrastructure

- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **ESLint/Prettier** - Code quality
- **Husky** - Git hooks

## 📚 Documentation

- [MongoDB Integration Guide](MONGODB_GUIDE.md) - Complete MongoDB setup and best practices
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [Mobile App README](mobile-app/README.md) - Mobile app setup and development
- [Commands Reference](COMMANDS.md) - Quick command reference

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
mongosh

# Verify connection string format
mongodb://localhost:27017/kivo
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

### Mobile App Connection Issues

- Ensure backend is running
- Update API_BASE_URL in mobile app
- For physical devices, use computer's IP address

## 📄 License

Released under the [MIT License](LICENSE).

## 👨‍💻 Author

**Abdulmuiz** - [GitHub](https://github.com/Abdulmuiz44)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- MongoDB for excellent documentation
- Expo team for simplifying React Native development
- All open-source contributors

---

**⭐ Star this repo if you find it helpful!**
