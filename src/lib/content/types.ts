export type ContentStatus = "VISIBLE" | "HIDDEN";

export type ContentAuthor = {
  name: string;
  initials: string;
  color: string;
  username: string;
  avatarUrl: string | null;
};

export type AdminPostRow = {
  id: string;
  author: ContentAuthor;
  excerpt: string;
  imageCount: number;
  commentCount: number;
  likeCount: number;
  reportCount: number;
  status: ContentStatus;
  createdAt: string;
};

export type AdminCommentRow = {
  id: string;
  author: ContentAuthor;
  content: string;
  postExcerpt: string;
  reportCount: number;
  status: ContentStatus;
  createdAt: string;
};

export type AdminMediaRow = {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  author: ContentAuthor;
  postExcerpt: string;
  reportCount: number;
  status: ContentStatus;
  createdAt: string;
};

export type AdminDocumentRow = {
  id: string;
  title: string;
  type: string;
  subject: string | null;
  level: string | null;
  fileUrl: string;
  downloadCount: number;
  author: ContentAuthor;
  reportCount: number;
  status: ContentStatus;
  createdAt: string;
};
