# Shared Package Guide (@area/shared)

This package contains shared Typescript code (types, utilities, constants, hooks) used across the monorepo (e.g., `client_web`, `backend`).

## 📁 Structure

```
packages/shared/
├── src/
│   ├── index.ts       # Main entry point (exports everything)
│   └── ...            # Your shared code files
├── dist/              # Generated build output (do not edit)
└── package.json
```

## 🛠️ Building

This package uses [tsup](https://tsup.egoist.dev/) for bundling, which requires zero config for most cases and is very fast.

### Commands

Run these commands from the `packages/shared` directory:

- **Build**: Compiles the code to CommonJS and ESM formats in the `dist/` folder.
  ```bash
  pnpm build
  ```

- **Develop (Watch Mode)**: Watches for changes and rebuilds automatically.
  ```bash
  pnpm dev
  ```

> **Note**: If you are running the project from the root using a command like `pnpm dev` that triggers all workspaces, this package might be built automatically.

## 📦 Using in Other Packages

To usage this package in another workspace (e.g., `client_web` or `backend`):

1. **Add Dependency**:
   Ensure the `package.json` of the consuming app includes the dependency:
   ```json
   "dependencies": {
     "@area/shared": "workspace:*"
   }
   ```
   *(The `workspace:*` version ensures you always use the local version of the package.)*

2. **Install**:
   Run `pnpm install` from the root to link the packages.

3. **Import**:
   You can now import exported members from `@area/shared`:
   ```typescript
   import { UserRole } from '@area/shared';
   ```

## 🚀 Adding New Code

1. create a new file or add code to `packages/shared/src/`.
2. **Important**: Export your new code in `packages/shared/src/index.ts`.
   ```typescript
   // packages/shared/src/index.ts
   export * from './my-new-file';
   ```
3. Run `pnpm build` (or have `pnpm dev` running) to update the `dist/` folder.
4. Only types and code present in `dist/` are accessible to other packages.

## ⚠️ Troubleshooting

- **"Module not found"**:
  - Check if you exported the member in `src/index.ts`.
  - Check if you ran `pnpm build` to update the `dist/` folder.
  - Restart the dev server of the consuming app (e.g., vite or node server).

- **Changes not reflecting**:
  - Ensure you are running `pnpm dev` in the shared package, or manually ran `pnpm build` after saving changes.
