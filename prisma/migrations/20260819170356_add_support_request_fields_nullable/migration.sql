/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `support_requests` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[trackingTokenHash]` on the table `support_requests` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `support_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SupportRequestStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "SupportRequestStatus" ADD VALUE 'WAITING_FOR_USER';
ALTER TYPE "SupportRequestStatus" ADD VALUE 'CLOSED';
ALTER TYPE "SupportRequestStatus" ADD VALUE 'REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SupportRequestType" ADD VALUE 'ACCOUNT_DELETION';
ALTER TYPE "SupportRequestType" ADD VALUE 'BUG_REPORT';
ALTER TYPE "SupportRequestType" ADD VALUE 'FEEDBACK';
ALTER TYPE "SupportRequestType" ADD VALUE 'OTHER';

-- DropForeignKey
ALTER TABLE "support_requests" DROP CONSTRAINT "support_requests_userId_fkey";

-- AlterTable
ALTER TABLE "support_requests" ADD COLUMN     "code" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "guestName" TEXT,
ADD COLUMN     "ipHash" TEXT,
ADD COLUMN     "trackingTokenHash" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "support_request_replies" (
    "id" TEXT NOT NULL,
    "supportRequestId" TEXT NOT NULL,
    "adminId" TEXT,
    "message" TEXT NOT NULL,
    "statusAtReply" "SupportRequestStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_request_replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "support_requests_code_key" ON "support_requests"("code");

-- CreateIndex
CREATE UNIQUE INDEX "support_requests_trackingTokenHash_key" ON "support_requests"("trackingTokenHash");

-- CreateIndex
CREATE INDEX "support_requests_contactEmail_idx" ON "support_requests"("contactEmail");

-- CreateIndex
CREATE INDEX "support_requests_status_idx" ON "support_requests"("status");

-- CreateIndex
CREATE INDEX "support_requests_createdAt_idx" ON "support_requests"("createdAt");

-- CreateIndex
CREATE INDEX "support_requests_ipHash_idx" ON "support_requests"("ipHash");

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_request_replies" ADD CONSTRAINT "support_request_replies_supportRequestId_fkey" FOREIGN KEY ("supportRequestId") REFERENCES "support_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
