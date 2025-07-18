/*
  Warnings:

  - You are about to drop the `Analysis` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `keyConcept` to the `Translations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `solution` to the `Translations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `summary` to the `Translations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Analysis" DROP CONSTRAINT "Analysis_translationId_fkey";

-- AlterTable
ALTER TABLE "Translations" ADD COLUMN     "keyConcept" TEXT NOT NULL,
ADD COLUMN     "solution" TEXT NOT NULL,
ADD COLUMN     "summary" TEXT NOT NULL;

-- DropTable
DROP TABLE "Analysis";
