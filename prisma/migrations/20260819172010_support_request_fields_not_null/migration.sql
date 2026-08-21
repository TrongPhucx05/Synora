/*
  Warnings:

  - Made the column `code` on table `support_requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contactEmail` on table `support_requests` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "support_requests" ALTER COLUMN "code" SET NOT NULL,
ALTER COLUMN "contactEmail" SET NOT NULL;
