# Starlight Music Player - Final Presentation Outline

## COMP 4800 - 14-16 Slides

---

## Slide 1: Title Slide

**Content:**

- Project Title: **Starlight Music Player**
- Subtitle: Cross-Platform Music Library Management System
- Course: COMP 4800 - ISSP Fall 2025
- Team Members: [Names]
- Date: [Presentation Date]
- Visual: Starlight logo/branding

---

## Slide 2: Project Overview & Vision

**Content:**

- **What is Starlight?**
  - Cross-platform music player application
  - Combines local music library with Spotify integration
  - Modern, intuitive user interface
- **Core Vision:**
  - Unified music experience across platforms
  - Seamless integration of local and streaming content
  - User-centric design with powerful library management
- **Key Differentiators:**
  - Offline-first architecture
  - Cross-platform compatibility (iOS, Android, Web)
  - Advanced playlist management

---

## Slide 3: Problem Statement

**Content:**

- **Current Market Gaps:**
  - Fragmented music experience (local files vs. streaming)
  - Limited cross-platform music players
  - Complex library management interfaces
  - Lack of seamless playlist import/export
- **User Pain Points:**
  - Difficulty managing large local music libraries
  - Inability to combine local and streaming playlists
  - Platform-specific limitations
  - Poor metadata extraction and organization
- **Our Solution:**
  - Unified platform for all music sources
  - Intelligent file scanning and metadata extraction
  - Spotify playlist import functionality
  - Cross-platform consistency

---

## Slide 4: Project Goals & Objectives

**Content:**

- **Primary Goals:**
  - ✅ Build a cross-platform music player (iOS, Android, Web)
  - ✅ Implement local music library management
  - ✅ Integrate Spotify OAuth and playlist import
  - ✅ Create intuitive, modern user interface
  - ✅ Support advanced playlist management
- **Technical Objectives:**
  - Platform-agnostic database layer (SQLite/IndexedDB)
  - Efficient file scanning and metadata extraction
  - Secure OAuth implementation with PKCE
  - Responsive audio playback system
- **Success Metrics:**
  - Functional on all three platforms
  - Successful Spotify integration
  - Smooth audio playback experience
  - User-friendly interface

---

## Slide 5: Technology Stack

**Content:**

- **Frontend Framework:**
  - React Native with Expo (~54.0.10)
  - Expo Router for navigation
  - React Native Reusables UI components
  - NativeWind (Tailwind CSS for React Native)
- **State Management:**
  - Zustand for lightweight, performant state
- **Database:**
  - Drizzle ORM for type-safe queries
  - SQLite (native platforms)
  - IndexedDB (web platform)
- **Backend:**
  - Koa.js with TypeScript
  - Prisma ORM (PostgreSQL)
  - Spotify Web API integration
- **Audio:**
  - expo-audio for playback
  - music-metadata for metadata extraction
- **Visual:** Technology stack diagram/logos

---

## Slide 6: System Architecture - High-Level Overview

**Content:**

- **Architecture Diagram:**

  ```
  ┌─────────────────────────────────────┐
  │   Client Layer (React Native/Expo)  │
  │   - UI Components                    │
  │   - State Management (Zustand)      │
  └─────────────────────────────────────┘
                  ↕
  ┌─────────────────────────────────────┐
  │   Services Layer                    │
  │   - Library Service                 │
  │   - Playback Service                │
  │   - Playlist Service                │
  │   - File Scanner                    │
  └─────────────────────────────────────┘
                  ↕
  ┌─────────────────────────────────────┐
  │   Repository Layer                  │
  │   - Library Repository              │
  │   - Playlist Repository             │
  │   - Playback Repository             │
  └─────────────────────────────────────┘
                  ↕
  ┌─────────────────────────────────────┐
  │   Database Layer                     │
  │   - SQLite (Native) / IndexedDB (Web)│
  └─────────────────────────────────────┘

  ┌─────────────────────────────────────┐
  │   Backend Server (Koa.js)            │
  │   - OAuth Flow (PKCE)                │
  │   - Token Management                 │
  │   - API Caching                      │
  │   - Spotify API Proxy                │
  └─────────────────────────────────────┘
                  ↕
  ┌─────────────────────────────────────┐
  │   External Services                  │
  │   - Spotify Web API                  │
  │   - PostgreSQL (Backend)             │
  └─────────────────────────────────────┘
  ```

- **Key Architectural Decisions:**
  - Platform-agnostic data layer
  - Separation of concerns (UI, State, Services, Data)
  - Server-side token management for security

---

## Slide 7: Core Features - Music Library Management

**Content:**

- **File Scanning & Import:**
  - Recursive folder scanning (web)
  - Individual file selection (mobile)
  - Support for multiple audio formats (MP3, M4A, FLAC, WAV, AAC, OGG, WMA)
  - Automatic metadata extraction from audio files
- **Library Organization:**
  - View by Tracks, Artists, Albums
  - Sortable track table view
  - Duplicate detection and handling
  - Metadata enrichment and updates
- **Database Schema:**
  - Artists, Albums, Tracks relationships
  - Playback state persistence
  - Playlist management
- **Visual:** Screenshot of library view, database schema diagram

---

## Slide 8: Core Features - Spotify Integration

**Content:**

- **OAuth Authentication:**
  - Secure PKCE (Proof Key for Code Exchange) flow
  - Server-side token storage
  - Automatic token refresh
  - CSRF protection with state parameter
- **Playlist Import:**
  - Browse user's Spotify playlists
  - Import playlists to local database
  - Preserve track order and metadata
  - Support for preview URLs (30-second previews)
- **API Caching:**
  - Response caching (5-10 min TTL)
  - Reduces Spotify API rate limit issues
  - User-specific cache invalidation
- **Visual:** OAuth flow diagram, playlist import screenshot

---

## Slide 9: Core Features - Audio Playback

**Content:**

- **Playback Controls:**
  - Play, pause, skip next/previous
  - Seek/scrub through tracks
  - Volume control
  - Progress tracking
- **User Experience:**
  - Mini player with quick controls
  - Full-screen now playing view
  - Trackpad/mouse wheel scrubbing (web)
  - Gesture-based controls (mobile)
- **Playback State:**
  - Persistent playback position
  - Resume from last position
  - Queue management
- **Visual:** Screenshot of now playing screen, mini player

---

## Slide 10: Core Features - Playlist Management

**Content:**

- **Playlist Creation:**
  - Create custom playlists
  - Add descriptions and cover images
  - System playlists support
- **Playlist Operations:**
  - Add/remove tracks
  - Drag-and-drop reordering (UI ready)
  - Play and shuffle functionality
  - Playlist detail views
- **Integration:**
  - Import from Spotify
  - Local playlist management
  - Track organization
- **Visual:** Playlist screenshots, drag-and-drop demo

---

## Slide 11: User Interface & Design

**Content:**

- **Design System:**
  - Dark mode support
  - Consistent theme tokens
  - Responsive design
  - Modern, clean aesthetic
- **Layout:**
  - Desktop-style sidebar navigation
  - Tab-based navigation structure
  - Modal-based interactions
  - Edge-to-edge design
- **Components:**
  - Reusable UI components
  - Custom themed components
  - Gesture handlers
  - Animations (Reanimated)
- **Visual:** UI screenshots showing different screens, theme examples

---

## Slide 12: Implementation Highlights - Backend Architecture

**Content:**

- **Backend Services:**
  - Koa.js server with TypeScript
  - Prisma ORM for database management
  - PostgreSQL for user/Spotify account storage
- **Security Features:**
  - PKCE implementation for OAuth
  - Server-side token storage (never exposed to client)
  - State parameter for CSRF protection
  - Secure token refresh mechanism
- **API Design:**
  - RESTful endpoints
  - `/auth/spotify/*` - OAuth routes
  - `/api/spotify/*` - Spotify API proxy
  - Caching middleware
- **Visual:** Backend architecture diagram, API endpoint list

---

## Slide 13: Implementation Highlights - Frontend Architecture

**Content:**

- **State Management:**
  - Zustand stores: Library, Player, Playlist
  - Reactive state updates
  - Efficient re-renders
- **Data Layer:**
  - Repository pattern for database abstraction
  - Platform-specific implementations (SQLite/IndexedDB)
  - Type-safe queries with Drizzle ORM
- **Service Layer:**
  - File scanner with batch processing
  - Metadata extraction service
  - Playback service with audio management
  - Playlist service with CRUD operations
- **Code Organization:**
  - Modular component structure
  - Separation of concerns
  - TypeScript throughout
- **Visual:** Frontend architecture diagram, code structure tree

---

## Slide 14: Challenges & Solutions

**Content:**

- **Challenge 1: Cross-Platform Database**
  - **Problem:** Different storage APIs (SQLite vs IndexedDB)
  - **Solution:** Repository pattern with platform-specific implementations
  - **Result:** Unified API, platform-agnostic code
- **Challenge 2: Spotify OAuth Security**
  - **Problem:** Secure token management in mobile/web apps
  - **Solution:** Server-side OAuth flow with PKCE, token storage in backend
  - **Result:** Secure, production-ready authentication
- **Challenge 3: File Scanning Performance**
  - **Problem:** Large libraries causing UI blocking
  - **Solution:** Batch processing, progress tracking, async operations
  - **Result:** Smooth scanning experience even with large libraries
- **Challenge 4: Metadata Extraction**
  - **Problem:** Inconsistent metadata in audio files
  - **Solution:** music-metadata library with fallback to filename parsing
  - **Result:** Comprehensive metadata extraction
- **Visual:** Before/after diagrams, performance metrics

---

## Slide 15: Testing & Validation

**Content:**

- **Testing Approach:**
  - Manual testing across platforms (iOS, Android, Web)
  - OAuth flow validation
  - File scanning with various formats
  - Playback functionality testing
  - Playlist operations verification
- **Test Scenarios:**
  - ✅ Spotify OAuth login/logout
  - ✅ Playlist import from Spotify
  - ✅ Local file scanning and import
  - ✅ Audio playback (local files and previews)
  - ✅ Playlist creation and management
  - ✅ Cross-platform compatibility
- **Performance Validation:**
  - Large library handling (1000+ tracks)
  - Playlist import performance
  - API caching effectiveness
  - Memory usage optimization
- **Visual:** Testing checklist, performance graphs

---

## Slide 16: Results & Achievements

**Content:**

- **Completed Features:**
  - ✅ Cross-platform music player (iOS, Android, Web)
  - ✅ Local music library management
  - ✅ Spotify OAuth integration
  - ✅ Playlist import from Spotify
  - ✅ Audio playback with controls
  - ✅ Playlist management system
  - ✅ Modern, responsive UI
  - ✅ Dark mode support
- **Technical Achievements:**
  - Platform-agnostic architecture
  - Secure OAuth implementation
  - Efficient file scanning
  - Type-safe database layer
- **Codebase Statistics:**
  - [Lines of code, if available]
  - Multiple services and components
  - Comprehensive documentation
- **Visual:** Feature checklist, app screenshots, architecture diagrams

---

## Slide 17: Future Enhancements (Optional - if 16 slides)

**Content:**

- **Short-term Improvements:**
  - Full search functionality implementation
  - Tag management system completion
  - Playlist sync with Spotify
  - Enhanced metadata editing
- **Long-term Vision:**
  - Cloud sync across devices
  - Additional streaming service integrations
  - Social features (sharing playlists)
  - Advanced audio analysis (BPM, key detection)
  - Smart playlists (auto-generated based on criteria)
- **Technical Enhancements:**
  - Token encryption in database
  - Enhanced error handling
  - Offline mode improvements
  - Performance optimizations
- **Visual:** Roadmap timeline, feature mockups

---

## Slide 18: Conclusion & Q&A

**Content:**

- **Project Summary:**
  - Successfully built cross-platform music player
  - Integrated local library with Spotify
  - Modern, user-friendly interface
  - Secure, scalable architecture
- **Key Learnings:**
  - Cross-platform development challenges
  - OAuth security best practices
  - Database abstraction patterns
  - State management optimization
- **Impact:**
  - Demonstrates full-stack development skills
  - Real-world application architecture
  - Production-ready code quality
- **Thank You & Questions**
- **Visual:** Project logo, team photo (optional)

---

## Presentation Tips

### Visual Elements to Include:

1. **Screenshots:**

   - Library view (tracks, artists, albums)
   - Now playing screen
   - Playlist management
   - Spotify import screen
   - Settings/theme options

2. **Diagrams:**

   - System architecture
   - OAuth flow
   - Database schema
   - Component hierarchy
   - Data flow

3. **Code Snippets:**

   - Key implementation examples
   - Architecture patterns
   - Service layer examples

4. **Metrics/Charts:**
   - Performance benchmarks
   - Feature completion status
   - Testing results

### Delivery Guidelines:

- **Time Management:** ~2-3 minutes per slide
- **Focus Areas:** Architecture, Features, Challenges, Results
- **Demo Preparation:** Have app ready for live demo or video
- **Backup Plans:** Screenshots if live demo fails
- **Engagement:** Ask questions, show enthusiasm

### Key Points to Emphasize:

1. **Cross-platform capability** - Works on iOS, Android, and Web
2. **Security** - Proper OAuth implementation with PKCE
3. **Architecture** - Clean, maintainable, scalable design
4. **User Experience** - Modern UI with intuitive navigation
5. **Integration** - Seamless Spotify playlist import
6. **Performance** - Efficient file scanning and playback

---

## Notes for Presenters

### Technical Deep-Dives (if asked):

- **OAuth Flow:** Explain PKCE, why it's needed, how tokens are managed
- **Database Abstraction:** Repository pattern, platform-specific implementations
- **State Management:** Why Zustand over Redux, how stores are organized
- **File Scanning:** Batch processing, metadata extraction process
- **Caching Strategy:** Why cache Spotify API responses, TTL management

### Potential Questions & Answers:

- **Q: Why React Native over native development?**
  - A: Cross-platform code sharing, faster development, Expo ecosystem
- **Q: How do you handle large music libraries?**
  - A: Batch processing, pagination, efficient database queries, lazy loading
- **Q: Security concerns with OAuth?**
  - A: PKCE prevents code interception, server-side token storage, HTTPS required
- **Q: Performance on mobile devices?**
  - A: Optimized file scanning, efficient state management, native audio playback
- **Q: Future scalability?**
  - A: Modular architecture, service layer abstraction, database optimization ready

---

**End of Presentation Outline**
