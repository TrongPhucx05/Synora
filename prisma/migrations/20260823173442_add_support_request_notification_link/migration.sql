-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SUPPORT_REQUEST_UPDATED';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "supportRequestId" TEXT;
