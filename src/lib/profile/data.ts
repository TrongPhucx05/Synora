import type { ProfileData } from "./types";

export const profileData: ProfileData = {
  name: "Trần Lê Quỳnh Anh",
  username: "@quynhanh.studynet",
  bio: "Học sinh lớp 12 tại THPT Nguyễn Du. Đam mê Hóa học, Toán học và IELTS. Chia sẻ tài liệu miễn phí cho cộng đồng học sinh Việt Nam 📚",
  school: "THPT Nguyễn Du, Hà Nội",
  location: "Hà Nội, Việt Nam",
  joinDate: "Tháng 3, 2024",
  website: "studynet.vn/quynhanh",
  stats: {
    followers: "4.812",
    following: 231,
    documents: 47,
    downloads: "28.4k",
  },
  subjects: ["Hóa học", "Toán học", "IELTS", "Vật Lý", "Kinh tế", "Sinh học"],
  mutualFriends: [],
  suggestions: [],
  recentDocs: [],
};

export const PROFILE_TABS = ["posts", "images", "documents", "saved"] as const;

export type ProfileTab = (typeof PROFILE_TABS)[number];