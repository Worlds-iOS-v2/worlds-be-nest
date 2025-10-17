-- CreateTable
CREATE TABLE "public"."AIQuestions" (
    "id" SERIAL NOT NULL,
    "menteeId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "AIQuestions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."AIQuestions" ADD CONSTRAINT "AIQuestions_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
