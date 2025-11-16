# 🚀 Quick Command Reference

## Commit and Push to GitHub

```bash
# Navigate to project directory
cd /workspaces/Kivo

# Stage all changes
git add -A

# Commit with message
git commit -m "feat: Complete Next.js TypeScript migration

- Migrated from Python FastAPI to Next.js 14 TypeScript
- Implemented all features: Redis, rate limiting, exports, webhooks
- Added CI/CD, Docker, comprehensive documentation
- Production-ready for Vercel deployment"

# Push to GitHub
git push origin main
```

## Or use the automated script:

```bash
chmod +x commit.sh
./commit.sh
```

## Build Commands

```bash
# Development
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint
pnpm lint:fix

# Type checking
pnpm type-check

# Format code
pnpm format
```

## Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild
docker-compose up --build
```

## Vercel CLI (Optional)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

## After Pushing to GitHub:

Vercel will automatically:

1. Detect the push
2. Run `pnpm install`
3. Run `pnpm build`
4. Deploy to production
5. Provide you with a live URL

No manual intervention needed!
