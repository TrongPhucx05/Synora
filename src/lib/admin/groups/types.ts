export type AdminGroupRow = {
  id: string;
  name: string;
  avatarUrl: string | null;
  leaderName: string;
  leaderUsername: string;
  memberCount: number;
  acceptedMemberCount: number;
  status: "ACTIVE" | "DISABLED";
  reportCount: number;
  createdAt: string;
};

export type AdminGroupMember = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isLeader: boolean;
  isAccepted: boolean;
  joinedAt: string;
};