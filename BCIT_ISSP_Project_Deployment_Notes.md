# BCIT ISSP Project Deployment Notes

## Starlight Music Player

This deployment notes document is designed to communicate the technical installation and deployment requirements for the Starlight Music Player project directly to your client. It details all necessary hardware and software prerequisites, configuration settings, and final code versions, ensuring that your client is fully informed about the deployment process.

---

## Installation Requirements

### Hardware:

**Development/Testing Environment:**

- **Development Machine**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+) with minimum 8GB RAM, 10GB free disk space
- **Mobile Devices** (for testing): iOS 13+ devices or Android 8.0+ (API level 26+) devices
- **Backend Server** (for production):
  - Minimum: 2 CPU cores, 4GB RAM, 20GB storage
  - Recommended: 4 CPU cores, 8GB RAM, 50GB SSD storage
  - Network: Stable internet connection for Spotify API integration

**Network:**

- Internet connectivity required for:
  - Spotify OAuth authentication
  - Spotify Web API access
  - Package installation (npm/yarn/pnpm)
  - Git repository access

### Software:

**Frontend Application (React Native/Expo):**

- **Node.js**: v18.0.0 or higher (LTS recommended)
- **Package Manager**: npm (v9+), yarn (v1.22+), pnpm (v8+), or bun (v1.0+)
- **Expo CLI**: Latest version (installed via `npm install -g expo-cli` or `npx expo`)
- **Development Tools**:
  - Git for version control
  - Code editor (VS Code recommended with React Native extensions)
  - iOS Simulator (macOS only) or Android Emulator
  - Expo Go app (for physical device testing)

**Backend Server (Koa.js):**

- **Node.js**: v18.0.0 or higher (LTS recommended)
- **TypeScript**: v5.5.0 or higher
- **Prisma**: v5.20.0 or higher
- **Database**: SQLite (included with Prisma, file-based: `starlight.db`)
- **Runtime**: Node.js runtime environment

**Additional Tools:**

- **Git**: For version control and code deployment
- **SSL Certificate**: Required for production HTTPS (Let's Encrypt recommended)
- **Process Manager** (Production): PM2, systemd, or Docker for process management

---

## Configurations

### Pre-installed Components Settings:

**Backend Server Configuration:**

**Environment Variables** (Required in `.env` file in `Starlight/backend/` directory):

```
# Server Configuration
PORT=3001
NODE_ENV=production

# Session Security
SESSION_SECRET=<generate-strong-random-secret>

# Spotify OAuth Configuration
SPOTIFY_CLIENT_ID=<your-spotify-client-id>
SPOTIFY_CLIENT_SECRET=<your-spotify-client-secret>
SPOTIFY_REDIRECT_URI=https://your-backend-url.com/auth/spotify/callback

# Frontend Integration
FRONTEND_DEEP_LINK=starlight://auth/spotify/success
FRONTEND_URL=https://your-frontend-url.com

# Cache Configuration (Optional)
SPOTIFY_CACHE_TTL=300
```

**Database Configuration:**

- **Database Type**: SQLite
- **Database Location**: `Starlight/backend/prisma/starlight.db`
- **Migration Command**: `npm run prisma:migrate` (run from `Starlight/backend/` directory)
- **Prisma Client Generation**: `npm run prisma:generate`

**Expo Application Configuration:**

- **App Name**: Starlight
- **Bundle Identifier**: `starlight` (scheme: `starlight://`)
- **Version**: 1.0.0 (as specified in `app.json`)
- **Platform Support**: iOS, Android, Web
- **New Architecture**: Enabled
- **Edge to Edge**: Enabled (Android)

### Additional Configurations:

**Backend Server Setup:**

1. **Database Initialization**:

   ```bash
   cd Starlight/backend
   npm install
   npm run prisma:generate
   npm run prisma:migrate
   ```

2. **Build Process**:

   ```bash
   npm run build
   ```

3. **Production Start**:
   ```bash
   npm start
   ```

**Frontend Application Setup:**

1. **Dependencies Installation**:

   ```bash
   cd Starlight
   npm install
   ```

2. **Development Server**:

   ```bash
   npm run dev
   ```

3. **Production Build** (for web):
   ```bash
   npm run web
   ```

**Security Considerations:**

- **HTTPS Required**: Production backend must use HTTPS for Spotify OAuth (Spotify does not allow HTTP in production)
- **Session Secret**: Generate a strong, random session secret for production (minimum 32 characters)
- **Token Encryption**: Spotify access tokens should be encrypted before storing in database (implement encryption layer)
- **CORS Configuration**: Configure CORS middleware to allow only your frontend domain
- **Environment Variables**: Never commit `.env` files to version control

**Log Management:**

- Backend logs: Configure logging to `/var/log/starlight/` or use a logging service
- Log rotation: Implement daily log rotation for production
- Error tracking: Consider integrating error tracking service (e.g., Sentry)

**Scheduled Tasks:**

- **Database Backup**: Configure daily backups of `starlight.db` at 2:00 AM
- **Cache Cleanup**: Implement scheduled task to clean expired API cache entries
- **Token Refresh**: Automatic token refresh handled by backend service

---

## Final Code

### Repository Location:

**Primary Repository:**

- **GitHub**: `https://github.com/Abhi-Bagai/COMP_4800_Music_Player.git`
- **Remote Name**: `origin`

**Alternative Repository:**

- **GitHub**: `https://github.com/Agora-Art/starlight.git`
- **Remote Name**: `starlight`

### Final Versions:

**Application Version:**

- **Frontend Version**: 1.0.0 (as specified in `Starlight/package.json` and `Starlight/app.json`)
- **Backend Version**: 1.0.0 (as specified in `Starlight/backend/package.json`)

**Key Dependency Versions:**

**Frontend:**

- Expo: 54.0.13
- React: 19.1.0
- React Native: 0.81.4
- Expo Router: ~6.0.10
- TypeScript: ~5.9.2

**Backend:**

- Node.js: v18+ (LTS recommended)
- Koa: ^2.15.0
- Prisma: ^5.20.0
- TypeScript: ^5.5.0

**Branch Information:**

- **Main Branch**: `main`
- **Tagged Releases**: No tags currently present (recommend tagging releases for production)

### Deployment Instructions:

1. **Clone Repository**:

   ```bash
   git clone https://github.com/Abhi-Bagai/COMP_4800_Music_Player.git
   cd COMP_4800_Music_Player
   ```

2. **Backend Deployment**:

   ```bash
   cd Starlight/backend
   npm install
   cp .env.example .env  # Create and configure .env file
   npm run prisma:generate
   npm run prisma:migrate
   npm run build
   npm start
   ```

3. **Frontend Deployment**:

   ```bash
   cd Starlight
   npm install
   npm run dev  # Development
   # or
   npm run web  # Web production build
   ```

4. **Mobile App Build** (using EAS Build):
   ```bash
   npm install -g eas-cli
   eas build --platform ios
   eas build --platform android
   ```

---

## Additional Notes

- **Spotify Integration**: Requires Spotify Developer account and registered application
- **Database**: SQLite is file-based; ensure proper backup strategy for production
- **Scaling**: For production scaling, consider migrating to PostgreSQL and implementing proper session management
- **Monitoring**: Implement health check endpoints and monitoring for production deployment
- **Documentation**: See `Starlight/backend/README.md` and `Starlight/README.md` for additional setup details
