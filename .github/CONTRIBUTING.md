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