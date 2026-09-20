"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { PostsTab } from "@/components/profile/tabs/PostsTab";
import { ImagesTab } from "@/components/profile/tabs/ImagesTab";
import { DocumentsTab } from "@/components/profile/tabs/DocumentsTab";
import { SavedPostsTab } from "@/components/profile/tabs/SavedPostsTab";
import { SubjectsWidget } from "@/components/profile/widgets/SubjectsWidget";
import { FriendsWidget } from "@/components/profile/widgets/FriendsWidget";
import { RecentDocsWidget } from "@/components/profile/widgets/RecentDocsWidget";
import { PROFILE_TABS } from "@/lib/profile/data";
import type { ProfileTab } from "@/lib/profile/data";
import { formatCount } from "@/lib/profile/utils";  

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<ProfileTab>(PROFILE_TABS[0]);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [friendsRefreshKey, setFriendsRefreshKey] = useState(0);
  const [docRefreshKey, setDocRefreshKey] = useState(0);

  const isOwner = session?.user?.username === username;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`/api/profile/${username}`)
      .then((r) => r.json())
      .then((data) => {
        setProfileData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username]);

  const refreshProfile = () => {
    fetch(`/api/profile/${username}`)
      .then((r) => r.json())
      .then(setProfileData);
    setFriendsRefreshKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div className="max-w-[1080px] mx-auto px-4 pb-12 pt-8">
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-surface-100 rounded-2xl" />
          <div className="h-6 w-48 bg-surface-100 rounded" />
          <div className="h-4 w-72 bg-surface-100 rounded" />
        </div>
      </div>
    );
  }

  if (!profileData || profileData.error) {
    return (
      <div className="max-w-[1080px] mx-auto px-4 pb-12 pt-20 text-center">
        <p className="text-text-muted text-sm">
          Không tìm thấy người dùng này.
        </p>
      </div>
    );
  }

  const stats = {
    followers: formatCount(profileData.stats.followers),
    following: profileData.stats.following,
    documents: profileData.stats.documents,
    downloads: formatCount(profileData.stats.downloads),
  };

  const joinDate = new Date(profileData.createdAt).toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-[1080px] mx-auto px-4 pb-12">
      <ProfileHeader
        coverUrl={profileData.profile?.coverUrl}
        avatarUrl={profileData.profile?.avatarUrl}
        displayName={profileData.profile?.displayName ?? profileData.username}
        username={username}
        isOwner={isOwner}
        friendStatus={profileData.friendStatus}
        incomingRequestId={profileData.incomingRequestId}
        profileData={profileData}
        onProfileSaved={refreshProfile}
        sessionUsername={session?.user?.username}
        onFriendStatusChanged={refreshProfile}
        isAdmin={session?.user?.role === "ADMIN"}
      />

      <ProfileInfo
        displayName={profileData.profile?.displayName ?? profileData.username}
        username={profileData.username}
        bio={profileData.profile?.bio}
        school={profileData.profile?.school}
        location={profileData.profile?.location}
        website={profileData.profile?.website}
        joinDate={joinDate}
      />
      <ProfileStats stats={stats} />

      <div className="flex gap-5">
        <div className="flex-1 min-w-0">
          <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />
          <div className="mt-3">
            {activeTab === "Bài đăng" && (
              <PostsTab
                username={username}
                isOwner={isOwner}
                session={session}
              />
            )}
            {activeTab === "Hình ảnh" && <ImagesTab username={username} />}
            {activeTab === "Tài liệu" && (
              <DocumentsTab
                username={username}
                isOwner={isOwner}
                refreshKey={docRefreshKey}
                onDownload={() => setDocRefreshKey((k) => k + 1)}
              />
            )}
            {activeTab === "Bài viết đã lưu" && (
              <SavedPostsTab username={username} isOwner={isOwner} />
            )}
          </div>
        </div>
        <div className="w-[252px] shrink-0 flex flex-col gap-3">
          <SubjectsWidget subjects={profileData.subjects} />
          <FriendsWidget username={username} refreshKey={friendsRefreshKey} onUnfriend={refreshProfile} />
          <RecentDocsWidget docs={profileData.recentDocs} username={username} />
        </div>
      </div>
    </div>
  );
}
