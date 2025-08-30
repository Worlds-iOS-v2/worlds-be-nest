/*
  Warnings:

  - A unique constraint covering the columns `[oauthProvider,oauthId]` on the table `Users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."OAuthProvider" AS ENUM ('apple', 'kakao', 'google');

-- AlterTable
ALTER TABLE "public"."Users" ADD COLUMN     "oauthId" TEXT,
ADD COLUMN     "oauthProvider" "public"."OAuthProvider",
ALTER COLUMN "birthday" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Users_userEmail_idx" ON "public"."Users"("userEmail");

-- CreateIndex
CREATE INDEX "Users_oauthProvider_oauthId_idx" ON "public"."Users"("oauthProvider", "oauthId");

-- CreateIndex
CREATE UNIQUE INDEX "Users_oauthProvider_oauthId_key" ON "public"."Users"("oauthProvider", "oauthId");
