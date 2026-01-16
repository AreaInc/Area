// Environment variable handling for both Web and Mobile
// For React Native (Expo), you might need to use expo-constants or react-native-dotenv
// For now, we'll default to localhost if not provided, or check for window/global objects if needed.

// Note: In a real monorepo, you might inject this config or use a shared config package.
// For simplicity, we are hardcoding localhost for dev, but in prod you'd want this to be dynamic.

export const API_BASE = "http://localhost:8080/api";
