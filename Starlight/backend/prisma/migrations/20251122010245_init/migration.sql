-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "spotify_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "spotifyUserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "scope" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "spotify_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_caches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "api_caches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "spotify_login_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "codeVerifier" TEXT NOT NULL,
    "codeChallenge" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "spotify_accounts_userId_key" ON "spotify_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "spotify_accounts_spotifyUserId_key" ON "spotify_accounts"("spotifyUserId");

-- CreateIndex
CREATE INDEX "spotify_accounts_userId_idx" ON "spotify_accounts"("userId");

-- CreateIndex
CREATE INDEX "spotify_accounts_spotifyUserId_idx" ON "spotify_accounts"("spotifyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "api_caches_key_key" ON "api_caches"("key");

-- CreateIndex
CREATE INDEX "api_caches_key_idx" ON "api_caches"("key");

-- CreateIndex
CREATE INDEX "api_caches_userId_idx" ON "api_caches"("userId");

-- CreateIndex
CREATE INDEX "api_caches_expiresAt_idx" ON "api_caches"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "spotify_login_attempts_state_key" ON "spotify_login_attempts"("state");

-- CreateIndex
CREATE INDEX "spotify_login_attempts_state_idx" ON "spotify_login_attempts"("state");

-- CreateIndex
CREATE INDEX "spotify_login_attempts_userId_idx" ON "spotify_login_attempts"("userId");

-- CreateIndex
CREATE INDEX "spotify_login_attempts_expiresAt_idx" ON "spotify_login_attempts"("expiresAt");
