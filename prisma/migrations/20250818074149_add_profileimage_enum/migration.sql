/*
  Warnings:

  - The `profileImage` column on the `Users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."ProfileImage" AS ENUM ('himchan', 'doran', 'malgeum', 'saengak');

-- AlterTable
ALTER TABLE "public"."Users" ALTER COLUMN "birthday" SET DATA TYPE TEXT,
DROP COLUMN "profileImage",
ADD COLUMN     "profileImage" "public"."ProfileImage";
