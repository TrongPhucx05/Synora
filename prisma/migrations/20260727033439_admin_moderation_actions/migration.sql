-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'POST_REMOVED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastViolationAt" TIMESTAMP(3),
ADD COLUMN     "violationCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "reason" "ReportReason",
    "note" TEXT,
    "notifiedUser" BOOLEAN NOT NULL DEFAULT false,
    "flaggedUser" BOOLEAN NOT NULL DEFAULT false,
    "postExcerpt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
