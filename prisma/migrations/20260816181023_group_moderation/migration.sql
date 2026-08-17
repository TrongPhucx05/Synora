-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ModerationActionType" ADD VALUE 'GROUP_DISABLED';
ALTER TYPE "ModerationActionType" ADD VALUE 'GROUP_ENABLED';
ALTER TYPE "ModerationActionType" ADD VALUE 'GROUP_DELETED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'GROUP_DISABLED';
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_ENABLED';
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_DELETED';
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_AUTO_DISBANDED';

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "disabledAt" TIMESTAMP(3),
ADD COLUMN     "isDisabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "leaderBanDeadline" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "moderation_actions" ADD COLUMN     "targetConversationId" TEXT;

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "conversationId" TEXT;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_targetConversationId_fkey" FOREIGN KEY ("targetConversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
