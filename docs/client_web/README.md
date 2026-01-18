# Web Client Architecture

> **Deep dive into the frontend implementation.**

## 🧭 Routing (TanStack Router)

We use file-based routing for type-safe navigation.

- `src/routes/__root.tsx`: The root layout wrapping the application.
- `src/routes/index.tsx`: Landing page.
- `src/routes/login.tsx` / `register.tsx`: Auth pages.
- `src/routes/dashboard`: Protected routes for logged-in users.

### Protected Routes
The `Dashboard` layout checks for a valid authentication token. If not present, it redirects to `/login`.

## 🧩 Key Components

### 1. Workflow Editor (`src/components/workflow`)
This is the core feature allowing users to create AREAs.
- **Node-based Interface**: Users drag and drop Actions and Reactions.
- **Configuration Forms**: Dynamic forms based on the selected service's schema.

### 2. Service Cards (`src/components/services`)
Display connection status for each service (Spotify, Google, etc.) and allow users to initiate the OAuth flow.

### 3. Sidebar (`app-sidebar.tsx`)
Collapsible navigation menu using Shadcn/ui components.

## 📡 API Integration

we use **TanStack Query** (React Query) for data fetching.
- Automatic caching and background re-fetching.
- Optimistic updates for better UX.
- Centralized `api` client (Axios or Fetch wrapper) in `src/lib`.

## 🎨 Styling

- **TailwindCSS**: Utility-first CSS.
- **Dark Mode**: Fully supported via a theme provider.
- **Animations**: Using `framer-motion` for smooth transitions.
