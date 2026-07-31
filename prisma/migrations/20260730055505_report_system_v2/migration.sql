/*
  Warnings:

  - The values [INAPPROPRIATE,COPYRIGHT,MISINFORMATION] on the enum `ReportReason` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isResolved` on the `reports` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

-- AlterEnum
BEGIN;
CREATE TYPE "ReportReason_new" AS ENUM ('HATE_SPEECH', 'SPAM', 'SEXUAL_CONTENT', 'VIOLENCE', 'SCAM', 'HARASSMENT', 'OTHER');
ALTER TABLE "users" ALTER COLUMN "suspensionReason" TYPE "ReportReason_new" USING ("suspensionReason"::text::"ReportReason_new");
ALTER TABLE "reports" ALTER COLUMN "reason" TYPE "ReportReason_new" USING ("reason"::text::"ReportReason_new");
ALTER TABLE "moderation_actions" ALTER COLUMN "reason" TYPE "ReportReason_new" USING ("reason"::text::"ReportReason_new");
ALTER TYPE "ReportReason" RENAME TO "ReportReason_old";
ALTER TYPE "ReportReason_new" RENAME TO "ReportReason";
DROP TYPE "public"."ReportReason_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_reportedUserId_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_reporterId_fkey";

-- AlterTable
ALTER TABLE "reports" DROP COLUMN "isResolved",
ADD COLUMN     "commentId" TEXT,
ADD COLUMN     "messageId" TEXT,
ADD COLUMN     "resolutionNote" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedById" TEXT,
ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
