# Contributing to Stellar BatchPay

This guide covers the local setup, architecture, testing workflow, and pull request expectations for `Stellar-Batch-Pay`.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Rust toolchain with `wasm32-unknown-unknown`
- Soroban CLI

## Local Setup

1. Clone your fork and add the upstream remote if needed:

```bash
git clone https://github.com/<your-user>/Stellar-Batch-Pay.git
cd Stellar-Batch-Pay
git remote add upstream https://github.com/jahrulezfrancis/Stellar-Batch-Pay.git
```

2. Install JavaScript dependencies:

```bash
npm install
```

3. Install the Soroban target for contract builds:

```bash
rustup target add wasm32-unknown-unknown
```

4. Install Soroban CLI if it is not already available:

```bash
cargo install --locked soroban-cli
```

## Development Workflow

Run the web app locally:

```bash
npm run dev
```

The Next.js application will be available at `http://localhost:3000`.

## Project Architecture

The repository is organized into three main areas:

- `app/`: Next.js App Router pages and API routes
- `components/`: reusable client-side UI components
- `lib/stellar/`: parsing, validation, batching, and transaction-building logic
- `contracts/batch-vesting/`: Soroban smart contract for time-locked batch vesting
- `tests/`: Vitest unit tests for the JavaScript and TypeScript payment logic

### Key modules

- `lib/stellar/parser.ts`: converts JSON and CSV files into payment rows
- `lib/stellar/validator.ts`: validates Stellar addresses, assets, and batch settings
- `lib/stellar/batcher.ts`: groups valid payment instructions into transaction-safe batches
- `app/api/batch-build/route.ts`: builds unsigned batch transactions for wallet signing

## Testing

Run the main checks locally before opening a pull request:

```bash
npm test
npm run typecheck
```

Run the production build:

```bash
npm run build
```

Run the Soroban contract tests from the `contracts/` workspace:

```bash
cargo test --manifest-path contracts/Cargo.toml
```

Build the Soroban contract artifacts:

```bash
cargo build --manifest-path contracts/Cargo.toml --target wasm32-unknown-unknown
```

Before opening a pull request, make sure the relevant local checks complete successfully.
The primary CI workflow now runs both Vitest and TypeScript typechecking, so `npm test` and `npm run typecheck` should both pass locally before you push.

## Pull Request Guidelines

- Create a focused branch from the latest `main`
- Keep each pull request scoped to a small set of related changes
- Add or update tests for behavior changes
- Update docs when the user-facing flow or developer workflow changes
- Include the linked issue numbers in the PR description
- Confirm the web app build and the relevant test suite pass locally before pushing

## Commit Guidelines

- Use clear commit messages describing the behavior change
- Avoid mixing refactors with unrelated fixes
- Do not force-push over someone else’s branch without coordination

## Reporting Issues

When opening an issue or PR, include:

- expected behavior
- actual behavior
- reproduction steps
- logs, screenshots, or failing test output when available
