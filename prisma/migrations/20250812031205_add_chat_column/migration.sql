-- AlterTable
ALTER TABLE "public"."ChatRoom" ADD COLUMN     "isHiddenForUserA" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isHiddenForUserB" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastReadMessageIdByA" INTEGER,
ADD COLUMN     "lastReadMessageIdByB" INTEGER;

-- AlterTable
ALTER TABLE "public"."Report" ADD COLUMN     "messageId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatRoom" ADD CONSTRAINT "ChatRoom_lastReadMessageIdByA_fkey" FOREIGN KEY ("lastReadMessageIdByA") REFERENCES "public"."Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatRoom" ADD CONSTRAINT "ChatRoom_lastReadMessageIdByB_fkey" FOREIGN KEY ("lastReadMessageIdByB") REFERENCES "public"."Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
