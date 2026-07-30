import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { id } = await params;

  const reports = await prisma.report.findMany({
    where: { reportedUserId: id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { reporter: { include: { profile: true } } },
  });

  const result = reports.map((r) => ({
    id: r.id,
    reason: r.reason,
    description: r.description,
    isResolved: r.isResolved,
    reporter: r.reporter.profile?.displayName ?? r.reporter.username,
    date: r.createdAt.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
  }));

  return NextResponse.json(result);
}