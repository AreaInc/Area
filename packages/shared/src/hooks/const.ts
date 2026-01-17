// Environment variable handling for both Web and Mobile
// For React Native (Expo), you might need to use expo-constants or react-native-dotenv
// For now, we'll default to localhost if not provided, or check for window/global objects if needed.

// Note: In a real monorepo, you might inject this config or use a shared config package.
// For simplicity, we are hardcoding localhost for dev, but in prod you'd want this to be dynamic.

// Default to a reasonable default, but allow injection
let apiBaseUrl = "http://localhost:8080/api";

export const setApiBaseUrl = (url: string) => {
  apiBaseUrl = url;
};

export const getApiBaseUrl = () => {
  return apiBaseUrl;
};

