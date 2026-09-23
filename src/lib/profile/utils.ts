export function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return String(n);
}

export function getViewUrl(fileUrl: string, type: string): string {
  const docTypes = [
    "PDF",
    "DOC",
    "DOCX",
    "PPT",
    "PPTX",
    "XLS",
    "XLSX",
    "OTHER",
  ];
  if (docTypes.includes(type.toUpperCase())) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=false`;
  }
  return fileUrl;
}

export function mapApiPostToCard(
  post: any,
  locale: string = "vi",
  defaultUserLabel: string = "User",
) {
  const displayName =
    post.author?.profile?.displayName ?? post.author?.username ?? defaultUserLabel;

  const mediaDocs = (post.documents ?? []).filter(
    (d: any) => d.type === "IMAGE" || d.type === "VIDEO",
  );
  const images = mediaDocs.map((d: any) => d.fileUrl);
  const mediaTypes = mediaDocs.map((d: any) =>
    d.type === "VIDEO" ? "video" : "image",
  );

  const attachmentDoc = (post.documents ?? []).find(
    (d: any) => d.type !== "IMAGE" && d.type !== "VIDEO",
  );
  const attachment = attachmentDoc
    ? {
        name: attachmentDoc.title ?? attachmentDoc.fileUrl.split("/").pop(),
        size: attachmentDoc.fileSize
          ? `${(attachmentDoc.fileSize / 1024).toFixed(1)} KB`
          : "",
        type: attachmentDoc.type,
        url: attachmentDoc.fileUrl,
      }
    : undefined;

  return {
    id: post.id,
    authorId: post.authorId,
    author: {
      name: displayName,
      initials: displayName
        .split(" ")
        .map((w: string) => w[0])
        .slice(-2)
        .join("")
        .toUpperCase(),
      color: "bg-primary",
      role: post.author?.role ?? "",
      username: post.author?.username,
      avatarUrl: post.author?.profile?.avatarUrl ?? null,
    },
    time: new Date(post.createdAt).toLocaleDateString(
      locale === "en" ? "en-US" : "vi-VN",
      { day: "numeric", month: "long", year: "numeric" },
    ),
    content: post.content,
    tags: (post.tags ?? []).map((t: any) => t.tag?.name ?? ""),
    likes: post._count?.likes ?? 0,
    comments: post._count?.comments ?? 0,
    isLikedByMe: Array.isArray(post.likes) && post.likes.length > 0,
    images: images.length ? images : undefined,
    mediaTypes: mediaTypes.length ? mediaTypes : undefined,
    attachment,
    visibility: post.visibility as
      | "PUBLIC"
      | "FRIENDS_ONLY"
      | "PRIVATE"
      | undefined,
    editedAt: post.editedAt ?? null,
  };
}