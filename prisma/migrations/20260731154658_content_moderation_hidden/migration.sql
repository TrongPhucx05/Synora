-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;
