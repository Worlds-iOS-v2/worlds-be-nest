/*
  Warnings:

  - You are about to drop the column `commnetId` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `translatedTest` on the `Translations` table. All the data in the column will be lost.
  - Added the required column `category` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Category" AS ENUM ('study', 'free');

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_commnetId_fkey";

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "answerCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "category" "Category" NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isAnswered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "commnetId",
ADD COLUMN     "commentId" INTEGER;

-- AlterTable
ALTER TABLE "Translations" DROP COLUMN "translatedTest",
ADD COLUMN     "translatedText" TEXT[];

-- CreateTable
CREATE TABLE "Attachment" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "questionId" INTEGER NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
