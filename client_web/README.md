# Web Client

> **Modern, responsive web interface for the AREA platform.**

Built with **React**, **Vite**, and **TailwindCSS**, the web client provides a sleek dashboard for managing your automation workflows.

## Tech Stack

- **Build Tool**: [Vite](https://vitejs.dev/)
- **Framework**: React 18
- **Styling**: TailwindCSS
- **Routing**: [TanStack Router](https://tanstack.com/router)
- **State Management**: Zustand / TanStack Query
- **UI Components**: Shadcn/ui (Radix Primitives)

## Running Locally

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:5173`.

## Project Structure

- `src/routes`: File-based routing definitions.
- `src/components`: Reusable UI components.
- `src/hooks`: Custom React hooks.
- `src/store`: Global state management.
- `src/lib`: Utilities and API clients.

## detailed Documentation

For a deep dive into the component architecture and features, see the **[Web Client Guide](../../docs/client_web/README.md)**.
