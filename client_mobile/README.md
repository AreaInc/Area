# Mobile Client

> **Native Android and iOS experience for AREA.**

Built with **React Native** and **Expo**, the mobile client allows users to manage their automation workflows on the go.

## 🛠 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/)
- **Runtime**: [Expo](https://expo.dev/)
- **Navigation**: React Navigation
- **Styling**: NativeWind (Tailwind for React Native) or StyleSheet

## 📱 Running Locally

Ensure you have the Expo Go app installed on your phone or an emulator running.

```bash
# Install dependencies
pnpm install

# Start the metro bundler
pnpm start
```

Scan the QR code with your phone to run the app.

## 📂 Project Structure

- `src/screens`: Individual screen components (Login, Dashboard, etc.).
- `src/navigation`: Stack and Tab navigator definitions.
- `src/components`: Reusable UI elements.
- `src/services`: API integration.

## 📖 Detailed Documentation

For screen flows and navigation structure, see the **[Mobile Client Guide](../../docs/client_mobile/README.md)**.
