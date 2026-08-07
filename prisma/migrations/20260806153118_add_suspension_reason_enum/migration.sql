/*
  Warnings:

  - The `reason` column on the `moderation_actions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `suspensionReason` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SuspensionReason" AS ENUM ('SPAM', 'INAPPROPRIATE', 'COPYRIGHT', 'MISINFORMATION', 'OTHER');

-- AlterTable
ALTER TABLE "moderation_actions" DROP COLUMN "reason",
ADD COLUMN     "reason" "SuspensionReason";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "suspensionReason",
ADD COLUMN     "suspensionReason" "SuspensionReason";
