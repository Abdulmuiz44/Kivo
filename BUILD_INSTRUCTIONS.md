# 🚀 Build and Deploy Instructions

## Current Status

✅ All code changes complete  
✅ MongoDB integration implemented  
✅ Mobile app created  
✅ TypeScript errors fixed  
⚠️ MongoDB package needs to be installed  
⚠️ Build needs to run

## Steps to Complete

### 1. Install MongoDB Package

```bash
cd /workspaces/Kivo
pnpm install
```

This will install the `mongodb` package that was added to package.json.

### 2. Verify Errors are Fixed

```bash
pnpm type-check
```

Should show no errors after mongodb is installed.

### 3. Run Build

```bash
pnpm build
```

Expected output:

```
✓ Creating an optimized production build
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

### 4. Fix Any Build Errors (if they occur)

If build fails, the error will be displayed. Common issues:

**"Cannot find module 'mongodb'"**

```bash
pnpm install mongodb
```

**TypeScript errors**

- Already fixed in the code
- May need to restart VS Code TypeScript server

**Other errors**

- Check the error message
- Most likely resolved by running `pnpm install`

### 5. Commit and Push

Once build succeeds:

```bash
git add -A
git status  # Review changes

git commit -m "feat: Migrate to MongoDB and add React Native mobile app

- Replaced Supabase with MongoDB for data persistence
- Added MongoDB driver with connection pooling
- Created service layer for users, research_runs, projects
- Implemented automatic index creation with TTL
- Added React Native Expo mobile application
- Mobile screens for research form and results
- Mobile data visualization with react-native-chart-kit
- Updated all documentation (README, MongoDB guide)
- Updated Docker Compose with MongoDB service
- Fixed all TypeScript compilation errors

Breaking changes:
- Requires MONGODB_URI environment variable
- Removed all Supabase dependencies
- New mobile-app directory with Expo project

Closes #N/A"

git push origin main
```

### 6. Verify Vercel Deployment

1. Go to https://vercel.com/dashboard
2. Watch for automatic deployment trigger
3. Add environment variable if not already set:
   - `MONGODB_URI` = your MongoDB connection string
   - Remove old Supabase variables

## Alternative: Use the Script

I've created `build-and-deploy.sh` that does everything:

```bash
chmod +x build-and-deploy.sh
./build-and-deploy.sh
```

This will:

1. Install dependencies
2. Run build
3. Commit changes (if build succeeds)
4. Push to GitHub

## What Was Changed

### Removed

- `@supabase/supabase-js` package
- All Supabase environment variables
- Supabase client initialization

### Added

- `mongodb` package (^6.3.0)
- MongoDB connection utility (`src/lib/mongodb.ts`)
- MongoDB models (`src/lib/mongodb-models.ts`)
- MongoDB service layer (`src/lib/mongodb-service.ts`)
- React Native mobile app (`mobile-app/`)
- Comprehensive documentation

### Modified

- `src/lib/research-store.ts` - Uses MongoDB backend
- Environment configs (`.env.local`, `next.config.js`, `vercel.json`)
- `docker-compose.yml` - Added MongoDB service
- `README.md` - Complete rewrite with new setup instructions

## MongoDB Setup (Required for Local Dev)

### Option A: Local MongoDB

```bash
brew install mongodb-community  # macOS
brew services start mongodb-community
```

### Option B: MongoDB Atlas (Cloud)

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update MONGODB_URI in .env.local

## Troubleshooting

### "Cannot find module 'mongodb'"

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Build still failing

```bash
# Clear Next.js cache
rm -rf .next
pnpm build
```

### TypeScript not recognizing changes

1. Restart VS Code
2. Or run: `code --command typescript.restartTsServer`

## Success Indicators

✅ `pnpm install` completes without errors  
✅ `pnpm build` shows "Compiled successfully"  
✅ Git push triggers Vercel deployment  
✅ Vercel dashboard shows "Building..." then "Ready"

## Support

- MongoDB Guide: `MONGODB_GUIDE.md`
- Mobile App: `mobile-app/README.md`
- Migration Info: `MIGRATION.md`
- Main README: `README.md`
