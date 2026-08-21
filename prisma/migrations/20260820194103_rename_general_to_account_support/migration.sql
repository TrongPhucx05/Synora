/*
  Warnings:

  - The values [GENERAL] on the enum `SupportRequestType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SupportRequestType_new" AS ENUM ('ACCOUNT_SUPPORT', 'BAN_APPEAL', 'ACCOUNT_DELETION', 'BUG_REPORT', 'FEEDBACK', 'OTHER');
ALTER TABLE "public"."support_requests" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "support_requests" ALTER COLUMN "type" TYPE "SupportRequestType_new" USING ("type"::text::"SupportRequestType_new");
ALTER TYPE "SupportRequestType" RENAME TO "SupportRequestType_old";
ALTER TYPE "SupportRequestType_new" RENAME TO "SupportRequestType";
DROP TYPE "public"."SupportRequestType_old";
ALTER TABLE "support_requests" ALTER COLUMN "type" SET DEFAULT 'ACCOUNT_SUPPORT';
COMMIT;

-- AlterTable
ALTER TABLE "support_requests" ALTER COLUMN "type" SET DEFAULT 'ACCOUNT_SUPPORT';
