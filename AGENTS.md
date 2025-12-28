# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the extension source (commands, generators, services, models, and utilities).
- `src/test/` holds Mocha-based unit tests and VS Code extension test scaffolding.
- `specs/` stores product specs and feature notes (PRD-* and numbered folders).
- `dist/` is the webpack bundle output for the published extension.
- `out/` is the compiled test output from `tsc`.

## Build, Test, and Development Commands
- `npm run compile`: bundle the extension with webpack for local runs.
- `npm run watch`: rebuild on changes during development.
- `npm run package`: production bundle with source maps for publishing.
- `npm run lint`: run ESLint over `src/`.
- `npm test`: run VS Code extension tests via `@vscode/test-cli` (includes `pretest`).
- `npm run compile-tests`: compile tests to `out/`.

## Coding Style & Naming Conventions
- TypeScript is the primary language; keep code in `src/`.
- Follow ESLint rules in `eslint.config.mjs`; run `npm run lint` before commits.
- Use descriptive camelCase for variables/functions and PascalCase for classes.
- Test files follow `*.test.ts` naming (e.g., `src/test/unit/services/schemaService.test.ts`).

## Testing Guidelines
- Tests use Mocha via the VS Code test runner.
- Unit tests live under `src/test/unit/` by domain (commands, services, models, utils).
- Prefer small, deterministic tests; add cases alongside related modules.

## Commit & Pull Request Guidelines
- Recent history uses Conventional Commit-style prefixes like `feat:`; follow that pattern when possible (`feat:`, `fix:`, `docs:`, `chore:`).
- Keep commits focused and describe user-visible impact in the subject line.
- PRs should include a concise summary, linked issue/spec when applicable, and test notes (commands run).

## Security & Configuration Notes
- Extension behavior depends on the `ms-mssql` VS Code extension; verify it is installed before testing.
- Configuration keys live under `sqlDataSeeder.*` in `package.json`; update documentation when adding new settings.
