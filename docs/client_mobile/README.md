# Mobile Client Architecture

> **Deep dive into the React Native app structure.**

## Navigation

We use **React Navigation** to manage screen transitions.

- `AppNavigator.js`: The root navigator handling the authentication flow.
    - **Auth Stack**: `LoginScreen`, `RegisterScreen`.
    - **Main Stack**: `HomeScreen`, `CreateWorkflowScreen`, `ProfileScreen`, `WorkflowDetailScreen`.

## Screens

### 1. Home Screen (`HomeScreen.js`)
Lists all the user's active and inactive workflows.
- Fetches data from `GET /workflows`.
- Allows toggling workflow status.

### 2. Create Workflow (`CreateWorkflowScreen.js`)
A multi-step form to create a new automation.
- **Step 1**: Select Trigger Service & Event.
- **Step 2**: Configure Trigger.
- **Step 3**: Select Action Service & Event.
- **Step 4**: Configure Action.

### 3. Workflow Detail (`WorkflowDetailScreen.js`)
Shows specific logs and configuration for a single workflow.

## API Integration

The mobile app communicates with the NestJS backend via REST API.
- **Authentication**: JWT tokens are stored in `AsyncStorage` (or `SecureStore` in production).
- **Network Requests**: Using `fetch` or `axios` wrapper in `src/services`.

## UI & Styling

The app uses standard React Native components styled with **NativeWind** (Tailwind CSS for React Native) or standard stylesheets, ensuring a consistent look and feel with the web platform.
