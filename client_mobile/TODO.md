# 📱 Mobile App - Backend Integration Roadmap

This document outlines the steps required to connect the Mobile Client (`client_mobile`) to the Backend, matching the features currently available in the Frontend.

## 🛠 1. Infrastructure & Configuration

- [x] **Environment Variables**
    - Install `react-native-dotenv` or use Expo `extra` config.
    - Create `.env` file with `API_URL` (e.g., `http://10.0.2.2:8080` for Android Emulator or your local IP for physical device).
    - **Note**: Do not use `localhost` on mobile devices; use your machine's local IP.

- [x] **API Client Setup**
    - Create `src/services/api.js` (or `.ts`).
    - Configure a standard `fetch` wrapper or `axios` instance.
    - **Critical**: Ensure `credentials: 'include'` is set to handle session cookies from Better-Auth.
    - Add request interceptors to inject headers if necessary (though Better-Auth relies on cookies).

## 🔐 2. Authentication (Better-Auth)

The backend uses **Better-Auth**. You need to replicate the login/register flows.

- [x] **Dependencies**
    - Install `expo-secure-store` to persist session details if needed (mostly cookies are handled by API client, but check persistence).

- [x] **Auth Context**
    - Create `src/context/AuthContext.js`.
    - Manage `user`, `isLoading`, and `isAuthenticated` state.
    - Implement `checkSession` on app launch (`GET /api/auth/session`).

- [x] **Login Screen**
    - Create `src/screens/auth/LoginScreen.js`.
    - Connect to `POST /api/auth/sign-in/email`.
    - Handle success (redirect to Home) and errors (Toast message).

- [x] **Register Screen**
    - Create `src/screens/auth/RegisterScreen.js`.
    - Connect to `POST /api/auth/sign-up/email`.

- [x] **Logout Functionality**
    - Add Logout button in `Profile` (User) tab.
    - Connect to `POST /api/auth/sign-out`.

## ⚡ 3. Workflows (The Core)

Replace the current mock data in `HomeScreen` with real API calls.

- [ ] **Workflow List (Home)**
    - Fetch workflows from `GET /api/workflows`.
    - Map API response to `WorkflowItem` component.
    - Handle "Empty State" (no workflows created yet).

- [ ] **Workflow Details**
    - Update `WorkflowDetailScreen` to receive `id` param.
    - Fetch full details from `GET /api/workflows/:id`.
    - Display real triggers and actions (Nodes/Edges equivalent).

- [ ] **Workflow Actions**
    - **Activate/Deactivate**: Connect toggles to `POST /api/workflows/:id/activate` (and `deactivate`).
    - **Delete**: Add delete option connecting to `DELETE /api/workflows/:id`.

- [ ] **Create Workflow**
    - Implement the "Plus" button in `BottomNav`.
    - Simple wizard to select:
        1. **Trigger** (Provider + Event)
        2. **Action** (Provider + Event)
    - POST payload to `/api/workflows`.

## 🔌 4. Services

Add a section to view and manage connected services (Spotify, Google, etc.).
*Note: This is currently missing in the mobile UI.*

- [ ] **Services Screen**
    - Create `src/screens/ServicesScreen.js`.
    - Add entry point in `BottomNav` or `Header`.
    - Fetch from `GET /api/services`.

- [ ] **Service Connection**
    - Implement OAuth flows for services.
    - Since this is mobile, you might need `expo-web-browser` to handle OAuth redirects from the backend (or deep links).

## 🎨 5. UI/UX Refinement

- [ ] **Navigation**
    - Create `AuthNavigator` (Login/Register) vs `AppNavigator` (Home/Tabs).
    - Switch based on `AuthContext` state.
- [ ] **Feedback**
    - Add Loading Spinners during API calls.
    - Add Error Toasts for failed requests.
