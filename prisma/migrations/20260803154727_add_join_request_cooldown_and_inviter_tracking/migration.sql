-- AlterTable
ALTER TABLE "conversation_members" ADD COLUMN     "invitedById" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3);
