-- CreateTable
CREATE TABLE "GovPro" (
    "id" SERIAL NOT NULL,
    "borough" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "applicationPeriod" TEXT NOT NULL,
    "programPeriod" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "personnel" TEXT NOT NULL,
    "programDetail" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "GovPro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KoPro" (
    "id" SERIAL NOT NULL,
    "borough" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "applicationPeriod" TEXT NOT NULL,
    "programPeriod" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "KoPro_pkey" PRIMARY KEY ("id")
);
