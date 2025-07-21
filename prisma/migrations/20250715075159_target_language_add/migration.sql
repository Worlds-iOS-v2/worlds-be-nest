/*
  Warnings:

  - You are about to drop the column `answerId` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `answerId` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the `Answer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AnswerLike` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `questionId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetLanguage` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_userId_fkey";

-- DropForeignKey
ALTER TABLE "AnswerLike" DROP CONSTRAINT "AnswerLike_answerId_fkey";

-- DropForeignKey
ALTER TABLE "AnswerLike" DROP CONSTRAINT "AnswerLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_answerId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_answerId_fkey";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "answerId",
ADD COLUMN     "questionId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "answerId";

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "targetLanguage" TEXT NOT NULL;

-- DropTable
DROP TABLE "Answer";

-- DropTable
DROP TABLE "AnswerLike";

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
