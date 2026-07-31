export type SupportRequestStatus = "PENDING" | "RESOLVED";

export type SupportRequestPerson = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
};

export type AdminSupportRequestRow = {
  id: string;
  user: SupportRequestPerson;
  subject: string;
  message: string;
  status: SupportRequestStatus;
  createdAt: string;
  resolvedAt?: string;
};
