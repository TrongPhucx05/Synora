-- CreateEnum
CREATE TYPE "Language" AS ENUM ('VI', 'EN');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "language" "Language" NOT NULL DEFAULT 'VI';
