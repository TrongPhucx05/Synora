-- CreateEnum
CREATE TYPE "SupportRequestStatus" AS ENUM ('PENDING', 'RESOLVED');

-- CreateTable
CREATE TABLE "support_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "SupportRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
