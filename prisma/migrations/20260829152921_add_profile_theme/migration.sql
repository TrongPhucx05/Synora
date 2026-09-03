-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "theme" "Theme" NOT NULL DEFAULT 'SYSTEM';
