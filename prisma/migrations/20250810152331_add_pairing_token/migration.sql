-- CreateTable
CREATE TABLE "public"."PairingToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "PairingToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PairingToken_token_key" ON "public"."PairingToken"("token");

-- AddForeignKey
ALTER TABLE "public"."PairingToken" ADD CONSTRAINT "PairingToken_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
