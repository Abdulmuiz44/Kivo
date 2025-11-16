# Autonomous Build Agent Specification

## 1. Purpose

This document defines a **self-running AI build agent** designed to ensure the Kivo Next.js TypeScript project remains in a continuously deployable state. The agent automatically detects, fixes, and validates all build errors, ensuring zero-downtime deployments to Vercel.

### Core Responsibilities

The agent MUST:

1. **Automatically run** `pnpm build` after every code change or feature addition
2. **Capture and parse** all build errors, TypeScript errors, runtime errors, and lint errors
3. **List errors** in structured format with file paths, line numbers, and error types
4. **Fix errors** directly in the codebase using intelligent code modifications
5. **Re-run** `pnpm build` after each fix
6. **Repeat** the detect → fix → rebuild loop until zero errors remain
7. **Commit changes** automatically with clean commit messages
8. **Ensure Vercel deployments** succeed without "insufficient permissions" or "authority limits" errors

---

## 2. Agent Execution Loop

The agent follows this continuous improvement loop:

### 2.1 Run Build

```bash
pnpm build
```

**Capture:**

- All stderr output (TypeScript errors, build failures)
- All stdout output (warnings, deprecation notices)
- Exit code (non-zero indicates failure)
- Build duration and performance metrics

**Output Format:**

```json
{
  "exitCode": 1,
  "errors": [],
  "warnings": [],
  "duration": "23.4s"
}
```

### 2.2 Parse Errors

For each error, extract:

- **File path**: Absolute or relative path to the problematic file
- **Line number**: Exact line where the error occurs
- **Column number**: Position within the line
- **Error type**: TypeScript (TS), ESLint, Next.js, Runtime, etc.
- **Error code**: TS2322, TS2345, etc.
- **Error message**: Full description of the problem
- **Severity**: Error, Warning, Info
- **Rule**: ESLint rule name if applicable

**Example Parsed Error:**

```json
{
  "file": "src/components/ResearchForm.tsx",
  "line": 42,
  "column": 15,
  "type": "TypeScript",
  "code": "TS2322",
  "message": "Type 'string | undefined' is not assignable to type 'string'",
  "severity": "error",
  "context": "const userId: string = currentUser?.id;"
}
```

### 2.3 Fix Errors

Apply intelligent code modifications:

1. **Analyze** the error context and surrounding code
2. **Determine** the minimal safe fix
3. **Apply** the modification directly to the file
4. **Preserve** existing logic and functionality
5. **Document** the fix if needed

**Fixing Strategy:**

- Prefer type guards over type assertions
- Add null checks before accessing optional properties
- Import missing dependencies
- Remove unused imports and variables
- Fix incorrect function signatures
- Correct mismatched prop types
- Add missing return statements
- Fix async/await issues

### 2.4 Rebuild

After applying fixes:

```bash
pnpm build
```

**Validation:**

- Check if the same error persists
- Verify no new errors were introduced
- Confirm build progresses further than previous attempt

### 2.5 Continue Until Clean

**Loop Termination Conditions:**

✅ **Success:** Exit code 0, zero errors, zero critical warnings
❌ **Failure:** Same error persists after 3 fix attempts
⚠️ **Limit:** Maximum 20 iterations to prevent infinite loops

### 2.6 Commit Results

Once all errors are fixed:

```bash
git add .
git commit -m "fix: auto-resolved build errors - [error count] issues fixed"
git push origin main
```

**Commit Message Format:**

- `fix: auto-resolved TypeScript strict mode errors`
- `fix: removed unused imports and variables`
- `fix: corrected prop types in ResearchForm component`
- `fix: added null checks for optional user properties`

### 2.7 Prepare for Vercel

**Pre-Deployment Checklist:**

- ✅ Verify all environment variables are documented in `.env.example`
- ✅ Ensure `next.config.js` has no syntax errors
- ✅ Validate `vercel.json` configuration
- ✅ Confirm `tsconfig.json` has correct settings
- ✅ Check no missing dependencies in `package.json`
- ✅ Verify no root-level build blockers
- ✅ Test API routes compile correctly
- ✅ Ensure no server/client component conflicts
- ✅ Validate all imports resolve correctly
- ✅ Confirm no circular dependencies

---

## 3. Error Categories the Agent Must Handle

### 3.1 TypeScript Errors

| Error Code | Description              | Fix Strategy                                           |
| ---------- | ------------------------ | ------------------------------------------------------ |
| TS2322     | Type mismatch            | Add type assertion, type guard, or fix type definition |
| TS2345     | Argument type mismatch   | Correct function call or parameter types               |
| TS2339     | Property does not exist  | Add property to interface or use optional chaining     |
| TS2304     | Cannot find name         | Import missing type or add declaration                 |
| TS2307     | Cannot find module       | Install missing package or fix import path             |
| TS2349     | Cannot invoke expression | Fix function call syntax                               |
| TS2554     | Expected N arguments     | Add missing arguments or make them optional            |
| TS2769     | No overload matches call | Fix function signature or arguments                    |
| TS7006     | Implicit any type        | Add explicit type annotation                           |
| TS7053     | No index signature       | Add index signature or use type guard                  |

### 3.2 Next.js Build Errors

- **Pages/App Router conflicts**: Ensure only one routing system is used
- **Client component errors**: Add `"use client"` directive when needed
- **Server component errors**: Remove client-only APIs from server components
- **Dynamic imports**: Fix incorrect dynamic import syntax
- **Image optimization**: Correct `next/image` usage
- **Font optimization**: Fix `next/font` configuration
- **Metadata API**: Correct metadata export format
- **Route handlers**: Fix API route export format

### 3.3 Missing Imports / Wrong Imports

- **Detect**: "Cannot find name" or "Module not found" errors
- **Fix**:
  - Add missing import statement
  - Correct import path (relative vs absolute)
  - Use path aliases (`@/` prefix)
  - Install missing npm package

### 3.4 Strict Mode Violations

- **Non-null assertion removal**: Replace `!` with null checks
- **Type narrowing**: Add type guards before accessing properties
- **Explicit return types**: Add return type annotations to functions
- **Strict property initialization**: Initialize class properties or mark as optional

### 3.5 Unused Variables & Unreachable Code

- **Unused imports**: Remove or prefix with `_` if intentionally unused
- **Unused variables**: Remove or use `_` prefix for parameters
- **Unreachable code**: Remove or fix conditional logic
- **Dead code elimination**: Remove commented-out code blocks

### 3.6 ESLint Problems

- **prettier/prettier**: Run `pnpm lint:fix` to auto-format
- **@typescript-eslint/no-unused-vars**: Remove or mark with `_` prefix
- **@typescript-eslint/no-explicit-any**: Replace `any` with proper types
- **react-hooks/exhaustive-deps**: Add missing dependencies to useEffect
- **@next/next/no-img-element**: Replace `<img>` with `<Image>`

### 3.7 API Route Errors

- **Missing export**: Ensure named exports (GET, POST, etc.)
- **Incorrect response**: Use `NextResponse.json()` for responses
- **Missing request handling**: Add proper request body parsing
- **Error handling**: Wrap in try-catch blocks
- **CORS issues**: Add proper headers in responses

### 3.8 React Server/Client Component Conflicts

**Client Components Need:**

- `"use client"` directive at top of file
- Cannot use server-only APIs
- Can use hooks, event handlers, browser APIs

**Server Components:**

- Default component type
- Can use server-only APIs (databases, file system)
- Cannot use hooks or event handlers
- Can be async functions

**Fix Strategy:**

- If component uses useState, useEffect, onClick → add `"use client"`
- If component uses database queries → keep as server component
- Split components if both behaviors are needed

### 3.9 Missing Environment Variables

- **Detection**: Check `.env.example` vs `.env.local`
- **Vercel**: Ensure all variables in `vercel.json` env section
- **Runtime checks**: Add validation in code
- **Documentation**: Update README.md with required variables

### 3.10 Mismatched Dependency Versions

- **Peer dependency conflicts**: Update to compatible versions
- **React version mismatches**: Ensure all packages use same React version
- **Next.js compatibility**: Verify packages work with Next.js 14
- **Lock file sync**: Run `pnpm install` to update lock file

### 3.11 Duplicate Default Exports

- **Detection**: "Duplicate export default" errors
- **Fix**: Keep only one default export or convert to named exports
- **Module resolution**: Check for circular imports

### 3.12 Undefined Functions or Props

- **Missing prop definitions**: Add to component prop types
- **Undefined function calls**: Import or define the function
- **Typos**: Correct function/variable names
- **Destructuring errors**: Fix destructure assignments

### 3.13 Zod Validation Issues

- **Schema mismatches**: Update Zod schema to match data structure
- **Type inference**: Use `z.infer<typeof schema>` for types
- **Validation errors**: Add proper error handling
- **Optional fields**: Use `.optional()` or `.nullable()` as needed

### 3.14 Other Compile-Time Errors

- **JSON parsing errors**: Fix malformed JSON in config files
- **Webpack configuration**: Fix custom webpack settings
- **PostCSS/Tailwind**: Correct configuration files
- **Build cache corruption**: Clear `.next` directory and rebuild

---

## 4. Auto-Fixing Rules

### 4.1 Safety-First Principles

1. **Minimal Changes**: Modify only the code necessary to fix the error
2. **Preserve Logic**: Never alter business logic or functionality
3. **Test Coverage**: Don't break existing tests
4. **Type Safety**: Always prefer type-safe solutions
5. **Backward Compatibility**: Maintain API contracts

### 4.2 Fixing Priorities

**Priority 1 - Blocking Errors:**

- TypeScript compilation errors
- Missing imports
- Syntax errors
- Module resolution failures

**Priority 2 - Build Warnings:**

- ESLint errors (not warnings)
- Deprecated API usage
- Type inconsistencies
- Unused exports

**Priority 3 - Quality Issues:**

- ESLint warnings
- Code style issues
- Performance warnings
- Console statements in production

### 4.3 Prohibited Fixes

❌ **Never Do:**

- Comment out large code blocks to "fix" errors
- Add `@ts-ignore` or `@eslint-disable` without fixing root cause
- Remove entire features or components
- Change API contracts without updating consumers
- Delete test files to fix test errors
- Use `any` type as a quick fix
- Disable strict mode to bypass errors

✅ **Always Do:**

- Fix the root cause of the error
- Add proper type annotations
- Import missing dependencies
- Update type definitions
- Add null checks and type guards
- Remove genuinely dead code
- Convert deprecated APIs to current standards

### 4.4 Code Quality Standards

**TypeScript:**

- Strict mode: enabled
- No implicit any
- Strict null checks: enabled
- No unused locals: warn
- No unused parameters: warn (allow `_` prefix)

**ESLint:**

- Prettier integration: enabled
- React hooks rules: enforced
- TypeScript specific rules: enforced
- Next.js specific rules: enforced

**Import Organization:**

1. React and Next.js imports
2. Third-party library imports
3. Local component imports
4. Type imports (use `import type`)
5. Style imports

---

## 5. Production-Ready Rules

### 5.1 TypeScript Strict Mode Stability

**Requirements:**

- All code compiles with `strict: true`
- No `any` types (except for legitimate cases with comments)
- All functions have return type annotations
- All props interfaces are fully typed
- No implicit return types for complex functions

**Validation:**

```bash
pnpm type-check
```

Must exit with code 0.

### 5.2 Vercel Build Success

**Requirements:**

- Build completes in under 10 minutes
- No memory overflow errors
- All static pages pre-render successfully
- All API routes are valid
- No missing environment variables
- Output directory (`.next`) is valid

**Test Command:**

```bash
pnpm build
```

Must exit with code 0.

### 5.3 Route Compilation

**Requirements:**

- All pages compile without errors
- All API routes have proper exports
- Dynamic routes have correct file naming
- No conflicting routes
- All middleware executes without errors

### 5.4 Component Compilation

**Requirements:**

- All React components are valid
- Server/client components properly separated
- No hooks in server components
- All imports resolve correctly
- No circular dependencies

### 5.5 Missing Exports

**Detect:**

- Scan for import statements
- Verify corresponding exports exist
- Check for typos in import/export names

**Fix:**

- Add missing exports
- Correct export names
- Convert default to named exports if needed

### 5.6 Critical Flow Testing

After auto-fixing, verify:

- ✅ Homepage loads without errors
- ✅ Research form submits successfully
- ✅ API routes respond correctly
- ✅ Authentication flow works (if applicable)
- ✅ Database connections succeed
- ✅ External API calls complete

### 5.7 Import Optimization

**Tree-Shaking:**

- Use named imports instead of default imports where possible
- Import only what's needed: `import { Button } from '@/components/ui'`
- Avoid barrel exports for large component libraries
- Use dynamic imports for code splitting

**Example:**

```typescript
// ❌ Bad - imports entire library
import _ from 'lodash';

// ✅ Good - imports only needed function
import { debounce } from 'lodash-es';
```

---

## 6. Agent Result & Finalization

### 6.1 Pre-Commit Checklist

Before committing fixes, the agent MUST verify:

- [ ] ✅ `pnpm build` exits with code 0
- [ ] ✅ `pnpm lint` shows zero errors
- [ ] ✅ `pnpm type-check` shows zero errors
- [ ] ✅ All files are properly formatted
- [ ] ✅ No `console.log` statements in production code
- [ ] ✅ No `debugger` statements
- [ ] ✅ No sensitive data in code (API keys, passwords)
- [ ] ✅ All environment variables documented
- [ ] ✅ `.gitignore` excludes build artifacts (`.next`, `node_modules`)
- [ ] ✅ No accidental `package-lock.json` (using pnpm)
- [ ] ✅ `pnpm-lock.yaml` is up to date
- [ ] ✅ All test files pass (if tests exist)
- [ ] ✅ No TypeScript `any` types without justification
- [ ] ✅ All imports are resolvable
- [ ] ✅ No circular dependencies

### 6.2 Production-Ready Guarantee

**The agent certifies:**

1. **Zero Build Errors**: The codebase compiles successfully
2. **Type Safety**: All TypeScript strict checks pass
3. **Code Quality**: ESLint shows no errors
4. **Import Resolution**: All modules resolve correctly
5. **API Routes**: All endpoints are properly exported
6. **React Components**: All components are valid and type-safe
7. **Environment Variables**: All required variables are documented
8. **Performance**: No obvious performance bottlenecks introduced
9. **Security**: No hardcoded secrets or vulnerabilities added
10. **Deployment Ready**: Vercel build will succeed

### 6.3 Vercel Deployment Success

**Pre-Deployment Validation:**

```bash
# Verify build works
pnpm build

# Verify TypeScript
pnpm type-check

# Verify linting
pnpm lint

# Check for issues
echo "Build validation complete ✓"
```

**Required Vercel Configuration:**

**`vercel.json`:**

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

**Environment Variables in Vercel:**

- MONGODB_URI
- REDIS_URL
- XAI_API_KEY
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- NODE_ENV=production

### 6.4 Authority Limits / Permission Errors

**Common Vercel Deployment Issues:**

**Issue 1: Build Timeout**

- **Cause**: Build takes too long (>10 min on Free tier)
- **Fix**: Optimize build, reduce dependencies, enable caching
- **Prevention**: Keep `next build` under 5 minutes

**Issue 2: Memory Limit Exceeded**

- **Cause**: Build process uses too much memory
- **Fix**: Optimize webpack config, reduce concurrent operations
- **Prevention**: Monitor build logs, use incremental builds

**Issue 3: Missing Environment Variables**

- **Cause**: Required env vars not set in Vercel dashboard
- **Fix**: Add all variables from `.env.example` to Vercel project settings
- **Prevention**: Document all required variables in README

**Issue 4: Node Version Mismatch**

- **Cause**: Different Node versions locally vs Vercel
- **Fix**: Specify Node version in `package.json`
- **Prevention**: Use `.node-version` or `engines` field

**Issue 5: Incorrect Build Command**

- **Cause**: Vercel using wrong build command
- **Fix**: Explicitly set in `vercel.json`
- **Prevention**: Always define `buildCommand`

**Issue 6: File Case Sensitivity**

- **Cause**: Import casing mismatch (works on Mac, fails on Linux)
- **Fix**: Ensure import statements match exact file names
- **Prevention**: Enable `forceConsistentCasingInFileNames` in `tsconfig.json`

### 6.5 Post-Deployment Verification

After successful deployment:

1. **Smoke Test**: Visit deployed URL
2. **API Check**: Test key API endpoints
3. **Console Check**: Verify no JavaScript errors in browser console
4. **Performance**: Check Core Web Vitals in Vercel Analytics
5. **Monitoring**: Review Vercel function logs for errors

---

## 7. Implementation Guidelines

### 7.1 Agent Execution Trigger

The agent runs automatically when:

1. **New commits** are pushed to the repository
2. **Pull requests** are opened or updated
3. **Scheduled runs** (e.g., nightly builds)
4. **Manual trigger** via GitHub Actions dispatch
5. **Dependency updates** via Dependabot

### 7.2 Error Detection Algorithm

```typescript
interface BuildError {
  file: string;
  line: number;
  column: number;
  type: 'TypeScript' | 'ESLint' | 'Next.js' | 'Runtime';
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  fix?: string;
}

function parseErrors(buildOutput: string): BuildError[] {
  const errors: BuildError[] = [];

  // Parse TypeScript errors
  const tsRegex = /(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)/g;
  // Parse ESLint errors
  const eslintRegex = /(.+?):(\d+):(\d+): (.+?) \[(.+?)\]/g;
  // Parse Next.js errors
  const nextRegex = /Error: (.+?) in file (.+?) on line (\d+)/g;

  // Extract and structure all errors
  // ...

  return errors;
}
```

### 7.3 Auto-Fix Implementation

```typescript
async function fixError(error: BuildError): Promise<boolean> {
  const fileContent = await readFile(error.file);
  const lines = fileContent.split('\n');

  // Analyze error type and apply appropriate fix
  switch (error.type) {
    case 'TypeScript':
      return fixTypeScriptError(error, lines);
    case 'ESLint':
      return fixESLintError(error, lines);
    case 'Next.js':
      return fixNextJsError(error, lines);
    default:
      return false;
  }
}

function fixTypeScriptError(error: BuildError, lines: string[]): boolean {
  // Implement TypeScript error fixing logic
  // Add type annotations, fix imports, etc.
  return true;
}
```

### 7.4 Iteration Loop

```typescript
async function runAgent(): Promise<void> {
  let iteration = 0;
  const maxIterations = 20;

  while (iteration < maxIterations) {
    // Run build
    const buildResult = await runCommand('pnpm build');

    if (buildResult.exitCode === 0) {
      console.log('✅ Build successful!');
      break;
    }

    // Parse errors
    const errors = parseErrors(buildResult.output);

    if (errors.length === 0) {
      console.log('✅ No fixable errors found');
      break;
    }

    // Fix errors
    let fixedCount = 0;
    for (const error of errors) {
      const fixed = await fixError(error);
      if (fixed) fixedCount++;
    }

    if (fixedCount === 0) {
      console.log('❌ Unable to fix remaining errors');
      break;
    }

    iteration++;
  }

  // Commit if fixes were made
  if (iteration > 0) {
    await commitChanges();
  }
}
```

---

## 8. Success Metrics

The agent is considered successful when:

1. **Zero Build Errors**: `pnpm build` exits with code 0
2. **Zero TypeScript Errors**: `pnpm type-check` passes
3. **Zero ESLint Errors**: `pnpm lint` shows no errors
4. **Clean Commit History**: All fixes committed with descriptive messages
5. **Vercel Deployment**: Production deployment succeeds without errors
6. **No Regressions**: Existing functionality remains intact
7. **Fast Iteration**: Fixes applied within 5 minutes
8. **Self-Healing**: Agent resolves 90%+ of common errors automatically

---

## 9. Monitoring & Logging

### 9.1 Build Logs

The agent maintains detailed logs:

```
[2025-11-16 20:36:53] Agent started
[2025-11-16 20:36:54] Running: pnpm build
[2025-11-16 20:37:15] Build failed with exit code 1
[2025-11-16 20:37:15] Found 5 errors:
  - src/components/ResearchForm.tsx:42 TS2322
  - src/lib/mongodb-models.ts:4 @typescript-eslint/no-unused-vars
  - src/lib/mongodb-models.ts:6 @typescript-eslint/no-unused-vars
[2025-11-16 20:37:16] Fixing error 1/5...
[2025-11-16 20:37:16] Applied fix to src/components/ResearchForm.tsx
[2025-11-16 20:37:17] Removed unused variable in src/lib/mongodb-models.ts
[2025-11-16 20:37:18] Running: pnpm build
[2025-11-16 20:37:35] ✅ Build successful!
[2025-11-16 20:37:36] Committing changes...
[2025-11-16 20:37:37] Agent completed successfully
```

### 9.2 Error Tracking

Track and report:

- Total errors found
- Errors fixed automatically
- Errors requiring manual intervention
- Build time before/after fixes
- Success rate over time

---

## 10. Conclusion

This autonomous build agent ensures the Kivo project maintains **continuous deployability** by:

- 🔄 **Automatically detecting** all build errors
- 🛠️ **Intelligently fixing** code issues
- ✅ **Validating** fixes with rebuild
- 📦 **Committing** clean code
- 🚀 **Enabling** zero-downtime Vercel deployments

**Result**: A production-ready codebase that deploys successfully every time, with zero "authority limits" or permission errors.

---

**Last Updated**: November 16, 2025  
**Version**: 1.0.0  
**Status**: ✅ Active & Production-Ready
