-- CreateEnum
CREATE TYPE "MembershipOrigin" AS ENUM ('INVITED', 'REQUESTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'GROUP_INVITE';
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_JOIN_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_JOIN_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_JOIN_REJECTED';

-- AlterTable
ALTER TABLE "conversation_members" ADD COLUMN     "origin" "MembershipOrigin" NOT NULL DEFAULT 'INVITED';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "conversationId" TEXT;

-- CreateTable
CREATE TABLE "group_invite_links" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_invite_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_invite_links_conversationId_key" ON "group_invite_links"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "group_invite_links_token_key" ON "group_invite_links"("token");

-- AddForeignKey
ALTER TABLE "group_invite_links" ADD CONSTRAINT "group_invite_links_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_invite_links" ADD CONSTRAINT "group_invite_links_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
