import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MainLayout from "@/components/layout/MainLayout";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { status: true },
    });

    if (user?.status === "SUSPENDED") redirect("/account-suspended");
    if (user?.status === "BANNED") redirect("/account-banned");
  }

  return <MainLayout>{children}</MainLayout>;
}
