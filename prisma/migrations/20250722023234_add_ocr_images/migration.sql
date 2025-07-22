-- CreateTable
CREATE TABLE "Ocr_Images" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,

    CONSTRAINT "Ocr_Images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ocr_Images" ADD CONSTRAINT "Ocr_Images_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
