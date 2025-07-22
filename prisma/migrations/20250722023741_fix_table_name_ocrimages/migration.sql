/*
  Warnings:

  - You are about to drop the `Ocr_Images` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Ocr_Images" DROP CONSTRAINT "Ocr_Images_userId_fkey";

-- DropTable
DROP TABLE "Ocr_Images";

-- CreateTable
CREATE TABLE "Ocrimages" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,

    CONSTRAINT "Ocrimages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ocrimages" ADD CONSTRAINT "Ocrimages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
