-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('POST_REMOVED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_BANNED', 'ACCOUNT_UNLOCKED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'ACCOUNT_SUSPENDED';
ALTER TYPE "NotificationType" ADD VALUE 'ACCOUNT_BANNED';
ALTER TYPE "NotificationType" ADD VALUE 'ACCOUNT_UNLOCKED';

-- AlterTable
ALTER TABLE "moderation_actions" ADD COLUMN     "suspendedUntil" TIMESTAMP(3),
ADD COLUMN     "type" "ModerationActionType" NOT NULL DEFAULT 'POST_REMOVED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "suspendedUntil" TIMESTAMP(3),
ADD COLUMN     "suspensionNote" TEXT,
ADD COLUMN     "suspensionReason" "ReportReason";
