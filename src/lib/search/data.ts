import { Search, BookOpen, MessageSquare, UserCircle, Hash } from "lucide-react";
import type { TabKey, ResultType } from "./types";

export const TAB_CONFIG: { key: TabKey; labelKey: string; icon: React.ElementType }[] = [
  { key: "all", labelKey: "tabs.all", icon: Search },
  { key: "documents", labelKey: "tabs.documents", icon: BookOpen },
  { key: "posts", labelKey: "tabs.posts", icon: MessageSquare },
  { key: "people", labelKey: "tabs.people", icon: UserCircle },
  { key: "topics", labelKey: "tabs.topics", icon: Hash },
] as const;

export const TYPE_TO_TAB: Record<ResultType, TabKey> = {
  document: "documents",
  post: "posts",
  person: "people",
  topic: "topics",
};

export const SECTION_LABEL_KEYS: Record<ResultType, string> = {
  document: "tabs.documents",
  post: "tabs.posts",
  person: "tabs.people",
  topic: "tabs.topics",
};

export const RESULT_SECTION_ORDER: ResultType[] = [
  "document", "post", "person", "topic",
];