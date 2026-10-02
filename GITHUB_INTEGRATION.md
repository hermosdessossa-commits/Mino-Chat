# GitHub Actions CI/CD Workflows

## CI Workflow (.github/workflows/ci.yml)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '9'

jobs:
  lint-and-typecheck:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck

      - name: Format check
        run: pnpm format --check

  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: mino_chat_test
          POSTGRES_USER: mino_chat
          POSTGRES_PASSWORD: mino_chat_test
        ports: 5432:5432
        options: >-
          --health-cmd "pg_isready -U mino_chat -d mino_chat_test"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 5
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm db:generate
        working-directory: ./packages/db

      - name: Run migrations
        run: pnpm db:migrate deploy
        working-directory: ./packages/db
        env:
          DATABASE_URL: postgresql://mino_chat:mino_chat_test@localhost:5432/mino_chat_test

      - name: Run tests
        run: pnpm test
        env:
          DATABASE_URL: postgresql://mino_chat:mino_chat_test@localhost:5432/mino_chat_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-key-for-ci-only
          JWT_REFRESH_SECRET: test-refresh-secret-for-ci-only
          S3_ENDPOINT: http://localhost:9000
          S3_ACCESS_KEY: minioadmin
          S3_SECRET_KEY: minioadmin
          S3_BUCKET: mino-chat-test

  build:
    name: Build All Packages
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, test]
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm db:generate
        working-directory: ./packages/db

      - name: Build
        run: pnpm build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: |
            apps/server/dist
            apps/web/dist
            packages/shared/dist
            packages/db/dist
          retention-days: 7

  e2e:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    needs: build
    timeout-minutes: 30
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: .

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Start services
        run: docker compose up -d postgres minio redis mailhog
        env:
          DATABASE_URL: postgresql://mino_chat:mino_chat_dev@localhost:5432/mino_chat

      - name: Run migrations
        run: pnpm db:migrate deploy
        working-directory: ./packages/db
        env:
          DATABASE_URL: postgresql://mino_chat:mino_chat_dev@localhost:5432/mino_chat

      - name: Start server
        run: |
          cd apps/server
          node dist/index.js &
          sleep 5
          curl -f http://localhost:3000/health

      - name: Start web (preview)
        run: |
          cd apps/web
          npx serve -s dist -l 5173 &
          sleep 3

      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:5173
          API_URL: http://localhost:3000

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: apps/web/playwright-report
          retention-days: 7
```

## Deploy Workflow (.github/workflows/deploy.yml)

```yaml
name: Deploy to Render

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'production'
        type: choice
        options:
          - production
          - staging

permissions:
  contents: read

jobs:
  deploy-api:
    name: Deploy API to Render
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'production' }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: '9'

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm db:generate
        working-directory: ./packages/db

      - name: Build server
        run: pnpm build --filter=server

      - name: Deploy to Render
        uses: render/deploy-action@v1
        with:
          service-id: ${{ secrets.RENDER_API_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
          wait-for-success: true
          timeout: 300

  deploy-web:
    name: Deploy Web to Render
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'production' }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: '9'

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build web
        run: pnpm build --filter=web
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_WS_URL: ${{ secrets.VITE_WS_URL }}

      - name: Deploy to Render
        uses: render/deploy-action@v1
        with:
          service-id: ${{ secrets.RENDER_WEB_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
          wait-for-success: true
          timeout: 300

  run-migrations:
    name: Run Database Migrations
    runs-on: ubuntu-latest
    needs: deploy-api
    environment: ${{ github.event.inputs.environment || 'production' }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: '9'

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm db:generate
        working-directory: ./packages/db

      - name: Run migrations
        run: pnpm db:migrate deploy
        working-directory: ./packages/db
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}

  notify:
    name: Notify Deployment
    runs-on: ubuntu-latest
    needs: [deploy-api, deploy-web, run-migrations]
    if: always()
    steps:
      - name: Deployment status
        run: |
          STATUS="${{ needs.deploy-api.result }} / ${{ needs.deploy-web.result }} / ${{ needs.run-migrations.result }}"
          echo "Deployment completed with status: $STATUS"
          if [[ "$STATUS" != *"success"* ]]; then
            exit 1
          fi
```

## Required GitHub Secrets

Configure these in your GitHub repository settings (Settings > Secrets and variables > Actions):

| Secret | Description |
|--------|-------------|
| `RENDER_API_SERVICE_ID` | Render API service ID for the API service |
| `RENDER_WEB_SERVICE_ID` | Render web service ID |
| `RENDER_API_KEY` | Render API key |
| `DATABASE_URL` | Production PostgreSQL connection string (Supabase) |
| `DIRECT_URL` | Direct PostgreSQL connection (for migrations) |
| `VITE_API_URL` | Production API URL (e.g., https://api.mino.chat) |
| `VITE_WS_URL` | Production WebSocket URL (e.g., wss://api.mino.chat) |
| `JWT_SECRET` | JWT signing secret |
| `JWT_REFRESH_SECRET` | JWT refresh token secret |
| `S3_ENDPOINT` | S3/MinIO endpoint |
| `S3_ACCESS_KEY` | S3 access key |
| `S3_SECRET_KEY` | S3 secret key |
| `S3_BUCKET` | S3 bucket name |
| `RESEND_API_KEY` | Resend API key for emails |

## Branch Protection Rules

Configure in Settings > Branches:

- **main**: Require PR reviews (1), status checks (CI), linear history
- **develop**: Require PR reviews (1), status checks (CI)

## Deploy Environments

Configure in Settings > Environments:

- **production**: Required reviewers, deployment branch: main
- **staging**: deployment branch: develop
```

## Additional GitHub Files

### .github/dependabot.yml

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "npm"
    groups:
      dev-dependencies:
        patterns:
          - "@types/*"
          - "eslint*"
          - "prettier*"
          - "typescript*"
          - "vitest*"
          - "playwright*"
      production-dependencies:
        patterns:
          - "*"
          - "!@types/*"
          - "!eslint*"
          - "!prettier*"
          - "!typescript*"
          - "!vitest*"
          - "!playwright*"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
```

### .github/CODEOWNERS

```
# Global owners
* @your-username

# Backend
/apps/server/ @backend-team
/packages/db/ @backend-team
/packages/shared/ @backend-team

# Frontend
/apps/web/ @frontend-team

# Infrastructure
/docker-compose.yml @devops-team
/.github/ @devops-team
/render.yaml @devops-team

# Documentation
/README.md @docs-team
/docs/ @docs-team
```

### .github/pull_request_template.md

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement
- [ ] Test addition

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing done

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings/errors
- [ ] Related issues linked

## Related Issues
Closes #

## Screenshots (if applicable)
```

### .github/issue_template/bug_report.yml

```yaml
name: Bug Report
description: Report a bug
title: "[BUG]: "
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: "Thanks for reporting a bug!"
  - type: input
    id: version
    attributes:
      label: Version
      description: What version are you using?
      placeholder: "v1.0.0"
    validations:
      required: true
  - type: textarea
    id: description
    attributes:
      label: Description
      description: Clear description of the bug
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to Reproduce
      description: Steps to reproduce the behavior
      placeholder: |
        1. Go to '...'
        2. Click on '...'
        3. See error
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What should happen?
    validations:
      required: true
  - type: textarea
    id: actual
    attributes:
      label: Actual Behavior
      description: What actually happens?
    validations:
      required: true
  - type: textarea
    id: logs
    attributes:
      label: Logs/Errors
      description: Any relevant logs or error messages
      render: shell
  - type: dropdown
    id: platform
    attributes:
      label: Platform
      options:
        - Web (Chrome)
        - Web (Firefox)
        - Web (Safari)
        - Mobile (iOS)
        - Mobile (Android)
    validations:
      required: true
```

### .github/issue_template/feature_request.yml

```yaml
name: Feature Request
description: Suggest a new feature
title: "[FEATURE]: "
labels: ["enhancement"]
body:
  - type: markdown
    attributes:
      value: "Thanks for suggesting a feature!"
  - type: textarea
    id: problem
    attributes:
      label: Problem
      description: What problem does this solve?
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: Describe the solution you'd like
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives
      description: Any alternative solutions considered?
  - type: dropdown
    id: priority
    attributes:
      label: Priority
      options:
        - Low
        - Medium
        - High
        - Critical
    validations:
      required: true
```

### .github/SECURITY.md

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

Please report security vulnerabilities to security@mino.chat.

We will respond within 48 hours and work on a fix promptly.
```

### .github/CONTRIBUTING.md

```markdown
# Contributing to Mino-Chat

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/mino-chat.git`
3. Create a branch: `git checkout -b feat/your-feature`
4. Make your changes
5. Run tests: `pnpm test`
6. Run lint: `pnpm lint`
7. Run typecheck: `pnpm typecheck`
8. Commit with conventional commits: `git commit -m "feat: add new feature"`
9. Push and open a PR

## Code Style

- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits
- Functional components with hooks
- No `any` types without justification

## Testing

- Unit tests: `pnpm test`
- E2E tests: `pnpm test:e2e`
- Coverage target: >80%

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `style:` formatting
- `refactor:` refactoring
- `test:` tests
- `chore:` maintenance
```

### render.yaml (Render Infrastructure as Code)

```yaml
# render.yaml - Infrastructure as Code for Render
# Deploy with: render deploy --config render.yaml
# Or connect repo in Render Dashboard and it will auto-detect

services:
  # API Service (Fastify + Socket.io)
  - type: web
    name: mino-chat-api
    runtime: docker
    dockerfilePath: ./apps/server/Dockerfile
    dockerContext: .
    plan: starter
    region: frankfurt
    autoDeploy: true
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "3000"
      - key: DATABASE_URL
        sync: false
      - key: DIRECT_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: JWT_ACCESS_EXPIRY
        value: "15m"
      - key: JWT_REFRESH_EXPIRY
        value: "7d"
      - key: JWT_REFRESH_EXPIRY_REMEMBER
        value: "30d"
      - key: REDIS_URL
        fromService:
          type: redis
          name: mino-chat-redis
          property: connectionURL
      - key: CORS_ORIGIN
        value: https://app.mino.chat
      - key: S3_ENDPOINT
        sync: false
      - key: S3_ACCESS_KEY
        sync: false
      - key: S3_SECRET_KEY
        sync: false
      - key: S3_BUCKET
        value: mino-chat
      - key: S3_REGION
        value: auto
      - key: S3_PUBLIC_URL
        value: https://cdn.mino.chat
      - key: RESEND_API_KEY
        sync: false
      - key: EMAIL_FROM
        value: Mino-Chat <noreply@mino.chat>

  # Web Service (Static React + Vite build served by Node)
  - type: web
    name: mino-chat-web
    runtime: docker
    dockerfilePath: ./apps/web/Dockerfile
    dockerContext: .
    plan: starter
    region: frankfurt
    autoDeploy: true
    healthCheckPath: /
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "5173"
      - key: VITE_API_URL
        value: https://api.mino.chat
      - key: VITE_WS_URL
        value: wss://api.mino.chat
      - key: VITE_APP_NAME
        value: Mino-Chat

  # Redis (Socket.io adapter, rate limiting, caching)
  - type: redis
    name: mino-chat-redis
    plan: free
    region: frankfurt
    maxmemoryPolicy: allkeys-lru

  # Background Worker (for async tasks: email, thumbnails, notifications)
  - type: worker
    name: mino-chat-worker
    runtime: docker
    dockerfilePath: ./apps/server/Dockerfile.worker
    dockerContext: .
    plan: starter
    region: frankfurt
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: REDIS_URL
        fromService:
          type: redis
          name: mino-chat-redis
          property: connectionURL
      - key: S3_ENDPOINT
        sync: false
      - key: S3_ACCESS_KEY
        sync: false
      - key: S3_SECRET_KEY
        sync: false
      - key: S3_BUCKET
        value: mino-chat
      - key: RESEND_API_KEY
        sync: false
      - key: EMAIL_FROM
        value: Mino-Chat <noreply@mino.chat>

databases:
  # Note: Using external Supabase for PostgreSQL
  # This is a placeholder for local development reference
  - name: mino-chat-db
    databaseName: mino_chat
    user: mino_chat
    plan: free
    region: frankfurt
    # Supabase connection details configured via env vars
```