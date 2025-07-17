-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "birthday" TIMESTAMP(3) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isMentor" BOOLEAN NOT NULL DEFAULT false,
    "mentorCode" TEXT,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "refreshToken" TEXT NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Translations" (
    "id" SERIAL NOT NULL,
    "menteeId" INTEGER NOT NULL,
    "originalText" TEXT[],
    "translatedTest" TEXT[],
    "targetLanguage" TEXT NOT NULL,
    "keyConcept" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_userEmail_key" ON "Users"("userEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Users_mentorCode_key" ON "Users"("mentorCode");

-- AddForeignKey
ALTER TABLE "Translations" ADD CONSTRAINT "Translations_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
