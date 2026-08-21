"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Activity,
  FileText,
  MessageSquare,
  UsersRound,
  BookOpen,
  Flag,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/dashboard/StatCard";
import { TopPosts } from "@/components/admin/dashboard/TopPosts";
import { TopReportedUsers } from "@/components/admin/dashboard/TopReportedUsers";
import { RecentActivity } from "@/components/admin/dashboard/RecentActivity";
import type { DashboardStats, TopPostItem } from "@/lib/admin/dashboard/types";

const PLACEHOLDER = {
  totalGroups: 156,
  pendingContent: 9,
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topPosts, setTopPosts] = useState<TopPostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data?.stats) setStats(data.stats);
        if (Array.isArray(data?.topPosts)) setTopPosts(data.topPosts);
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number | undefined) =>
    loading || n === undefined ? "—" : n.toLocaleString("vi-VN");

  return (
    <>
      <PageHeader
        title="Tổng quan"
        description="Tổng quan tình trạng hệ thống Synora"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard
          icon={Users}
          label="Tổng người dùng"
          value={fmt(stats?.totalUsers)}
          colorClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={Activity}
          label="Đang hoạt động (24h)"
          value={fmt(stats?.activeUsers)}
          colorClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={FileText}
          label="Tổng bài viết"
          value={fmt(stats?.totalPosts)}
          colorClass="bg-violet-50 text-violet-600"
        />
        <StatCard
          icon={MessageSquare}
          label="Tổng bình luận"
          value={fmt(stats?.totalComments)}
          colorClass="bg-cyan-50 text-cyan-600"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={UsersRound}
          label="Tổng nhóm"
          value={PLACEHOLDER.totalGroups}
          colorClass="bg-pink-50 text-pink-600"
          comingSoon
        />
        <StatCard
          icon={BookOpen}
          label="Tổng tài liệu"
          value={fmt(stats?.totalDocuments)}
          colorClass="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          icon={Flag}
          label="Báo cáo chưa xử lý"
          value={fmt(stats?.pendingReports)}
          colorClass="bg-red-50 text-red-600"
        />
        <StatCard
          icon={Clock}
          label="Yêu cầu hỗ trợ chưa xử lý"
          value={PLACEHOLDER.pendingContent}
          colorClass="bg-amber-50 text-amber-600"
          comingSoon
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <TopPosts
          posts={topPosts}
          loading={loading}
          onPostDeleted={(id) =>
            setTopPosts((prev) => prev.filter((p) => p.id !== id))
          }
        />
        <TopReportedUsers />
      </div>

      <RecentActivity />
    </>
  );
}
