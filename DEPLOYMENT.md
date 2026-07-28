# Deploying Kryndex Exchange Platform

This guide outlines the steps to deploy the **Next.js Web Frontend** to Vercel, the **NestJS Backend Microservices** to Render, and compiles the **Flutter Mobile App** locally.

---

## 1. Deploying Frontend to Vercel

Vercel provides native support for `pnpm` monorepos. To deploy the Next.js frontend (`apps/web`):

### Steps:
1. Push your repository code to GitHub, GitLab, or Bitbucket.
2. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your Git repository.
4. In the Project Configuration, adjust the settings:
   - **Framework Preset**: select `Next.js`.
   - **Root Directory**: edit and set this to `apps/web`.
   - **Build & Development Settings**:
     - **Build Command**: `pnpm build`
     - **Output Directory**: `.next`
     - **Install Command**: `pnpm install`
5. In the **Environment Variables** section, add your production environment variables:
   - `NEXT_PUBLIC_API_URL`: The public URL of your API Gateway (running on Render).
   - `NEXT_PUBLIC_WS_URL`: The public URL of your WebSocket service (running on Render).
6. Click **Deploy**. Vercel will build the frontend and serve it at a production URL.

---

## 2. Deploying Backend to Render

We have provided a Render Blueprint specification (`render.yaml`) in the root directory. This configures PostgreSQL, Redis, and all microservices dynamically.

### Steps:
1. Log in to [Render](https://render.com) and navigate to your dashboard.
2. Click **New** -> **Blueprint**.
3. Select your connected Git repository.
4. Render will parse the `render.yaml` file and show all resources to be spawned:
   - Managed Postgres Database (`kryndex-db`)
   - Managed Redis Cache (`kryndex-redis`)
   - Combined Backend Service (`kryndex-backend`): Runs API Gateway and all microservices concurrently inside the same container.
5. Enter a Blueprint name and click **Apply**.
6. Render will spin up the database and cache first, then build and deploy the Node.js services.

### Microservice Networking
- **Exposed Public URL**: The single exposed port maps to the API Gateway.
- **WebSocket Forwarding**: The API Gateway automatically intercepts WebSocket requests (`/socket.io/*` paths and connection upgrades) on the main port and proxies them internally to the local WebSocket service (port `3004`).
- **Private Microservices**: Communication between API Gateway and other services occurs over localhost private ports (`3001` for Auth, `3002` for Trading, `3003` for Wallet, `3004` for WebSockets) inside the secure container.

This means you only need to configure:
- `NEXT_PUBLIC_API_URL`: Your Render backend service URL (e.g. `https://kryndex-backend.onrender.com`).
- `NEXT_PUBLIC_WS_URL`: The exact same URL (since WebSockets are proxied through the same endpoint!).

---

## 3. Running & Building the Flutter Mobile App

The mobile application (`apps/mobile`) is built with Flutter and communicates with the backend services.

### Running Locally:
1. Ensure you have the Flutter SDK installed on your system. Run `flutter doctor` to check.
2. Open terminal in the mobile folder:
   ```bash
   cd apps/mobile
   ```
3. Install dependencies:
   ```bash
   flutter pub get
   ```
4. Update the backend connection hosts in your Dart config (e.g. `lib/main.dart` or your api service config) to point to your deployed Render API Gateway:
   ```dart
   const String baseUrl = "https://api-gateway.onrender.com";
   ```
5. Run the app on an active emulator or device:
   ```bash
   flutter run
   ```

### Building APK (Android):
To compile a release APK for Android distribution:
```bash
flutter build apk --release
```
The output file will be saved in `build/app/outputs/flutter-apk/app-release.apk`.

### Deploying Flutter Web to Vercel:
We have enabled the web platform target in the Flutter project and compiled it to static HTML/JS inside `apps/mobile/build/web`. Since we have unignored this folder, you can deploy it directly as a static website on Vercel:
1. Log in to your [Vercel](https://vercel.com) dashboard and click **Add New Project**.
2. Select your connected Git repository.
3. In the configuration:
   - **Framework Preset**: select `Other`.
   - **Root Directory**: set this to `apps/mobile/build/web`.
   - **Build & Development Settings**:
     - **Build Command**: (leave empty/disabled)
     - **Output Directory**: `.`
4. Click **Deploy**. Vercel will host the Flutter Web application at a production URL.

