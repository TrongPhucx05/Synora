import type { SearchResult } from "@/lib/search/types";
import { DocumentCard } from "@/components/search/cards/DocumentCard";
import { PostCard } from "@/components/search/cards/PostCard";
import { PersonCard } from "@/components/search/cards/PersonCard";
import { TopicCard } from "@/components/search/cards/TopicCard";

export function ResultCard({ r }: { r: SearchResult }) {
  if (r.type === "document") return <DocumentCard r={r} />;
  if (r.type === "post") return <PostCard r={r} />;
  if (r.type === "person") return <PersonCard r={r} />;
  if (r.type === "topic") return <TopicCard r={r} />;
  return null;
}