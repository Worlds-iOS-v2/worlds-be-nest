-- CreateTable
CREATE TABLE "EventPro" (
    "id" SERIAL NOT NULL,
    "borough" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "programPeriod" TEXT NOT NULL,
    "applicationPeriod" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventPro_pkey" PRIMARY KEY ("id")
);
