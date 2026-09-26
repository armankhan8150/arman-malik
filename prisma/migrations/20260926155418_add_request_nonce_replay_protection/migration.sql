-- CreateTable
CREATE TABLE "RequestNonce" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestNonce_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequestNonce_expiresAt_idx" ON "RequestNonce"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RequestNonce_userId_nonce_key" ON "RequestNonce"("userId", "nonce");

-- AddForeignKey
ALTER TABLE "RequestNonce" ADD CONSTRAINT "RequestNonce_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
