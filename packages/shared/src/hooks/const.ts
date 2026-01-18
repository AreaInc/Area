// Environment variable handling for both Web and Mobile
// For React Native (Expo), you might need to use expo-constants or react-native-dotenv
// For now, we'll default to localhost if not provided, or check for window/global objects if needed.

// Note: In a real monorepo, you might inject this config or use a shared config package.
// For simplicity, we are hardcoding localhost for dev, but in prod you'd want this to be dynamic.

// Runtime access to environment variables (works with Vite's import.meta.env)
// Vite will replace import.meta.env.VITE_API_URL at build time when this package is consumed
// We use a direct access pattern that Vite can replace during the consuming app's build
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - import.meta is available at runtime in Vite environments
export const API_BASE = "https://api.areamoncul.click/api"
// export const API_BASE = "http://localhost:8080/api" 

