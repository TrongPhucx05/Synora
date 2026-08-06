import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { DocumentType } from "@/generated/prisma/enums";

export async function GET() {
  try {
    const libraryWhere = {
      postId: null,
      type: { notIn: ["IMAGE", "VIDEO"] as DocumentType[] },
    };

    const [totalDocuments, totalContributors, downloads] = await Promise.all([
      prisma.document.count({ where: libraryWhere }),
      prisma.document
        .groupBy({
          by: ["uploaderId"],
          where: libraryWhere,
        })
        .then((r) => r.length),
      prisma.document.aggregate({
        where: libraryWhere,
        _sum: { downloadCount: true },
      }),
    ]);

    return NextResponse.json({
      totalDocuments,
      totalContributors,
      totalDownloads: downloads._sum.downloadCount ?? 0,
    });
  } catch (err) {
    console.error("[/api/library/stats]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
