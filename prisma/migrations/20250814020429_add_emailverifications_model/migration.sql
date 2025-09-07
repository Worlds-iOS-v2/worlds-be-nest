/*
  Warnings:

  - You are about to drop the column `mentorCode` on the `Users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Users_mentorCode_key";

-- AlterTable
ALTER TABLE "public"."Users" DROP COLUMN "mentorCode",
ADD COLUMN     "profileImage" TEXT;

-- CreateTable
CREATE TABLE "public"."EmailVerifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "userEmail" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "expirationTime" TIMESTAMP(3) NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerifications_userEmail_key" ON "public"."EmailVerifications"("userEmail");

-- CreateIndex
CREATE INDEX "EmailVerifications_userEmail_idx" ON "public"."EmailVerifications"("userEmail");

-- CreateIndex
CREATE INDEX "EmailVerifications_verificationCode_idx" ON "public"."EmailVerifications"("verificationCode");

-- AddForeignKey
ALTER TABLE "public"."EmailVerifications" ADD CONSTRAINT "EmailVerifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
