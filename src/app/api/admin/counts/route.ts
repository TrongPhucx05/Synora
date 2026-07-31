import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const [pendingReports, pendingSupportRequests] = await Promise.all([
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.supportRequest.count({ where: { status: "PENDING" } }),
  ]);

  return NextResponse.json({ pendingReports, pendingSupportRequests });
}
