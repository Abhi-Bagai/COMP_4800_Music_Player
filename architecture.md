flowchart TD
%% Client Layer
subgraph Client["Client Layer (React Native / Expo)"]
UI[UI Components & Screens]
State[State Management<br/>Zustand Stores]
Context[Context Providers<br/>Audio, Drag]
ClientServices[Services Layer<br/>Library, Playback, Playlist, Spotify]
Repo[Repository Layer<br/>Library, Playback, Playlist]
ClientDB[(SQLite / IndexedDB<br/>Drizzle ORM)]

        UI --> State
        UI --> Context
        State --> ClientServices
        Context --> ClientServices
        ClientServices --> Repo
        Repo --> ClientDB
    end

    %% Backend Layer
    subgraph Backend["Backend (Koa.js)"]
        Routes[Routes<br/>Auth, Spotify, Test]
        BackendServices[Services<br/>Token, Import, Cache]
        Middleware[Middleware<br/>Auth, CORS, Session]
        BackendDB[(PostgreSQL<br/>Prisma ORM)]

        Routes --> Middleware
        Routes --> BackendServices
        BackendServices --> BackendDB
    end

    %% External Services
    Spotify[Spotify Web API]

    %% Connections
    ClientServices -.HTTP API.-> Routes
    BackendServices --> Spotify

    %% Styling
    classDef clientStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef backendStyle fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef externalStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px

    class UI,State,Context,ClientServices,Repo,ClientDB clientStyle
    class Routes,BackendServices,Middleware,BackendDB backendStyle
    class Spotify externalStyle
