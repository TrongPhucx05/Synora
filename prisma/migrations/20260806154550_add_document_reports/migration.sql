-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "documentId" TEXT;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
