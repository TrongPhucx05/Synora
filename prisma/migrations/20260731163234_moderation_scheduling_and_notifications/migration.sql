-- CreateEnum
CREATE TYPE "SupportRequestType" AS ENUM ('GENERAL', 'BAN_APPEAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'REPORT_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE 'REPORT_RESOLVED';
ALTER TYPE "NotificationType" ADD VALUE 'REPORT_DISMISSED';
ALTER TYPE "NotificationType" ADD VALUE 'SUPPORT_REQUEST_SUBMITTED';

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "scheduledDeleteAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "scheduledDeleteAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "support_requests" ADD COLUMN     "type" "SupportRequestType" NOT NULL DEFAULT 'GENERAL';
