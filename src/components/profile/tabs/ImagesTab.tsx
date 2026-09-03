"use client";

import { useState, useEffect } from "react";

interface ImageItem {
  id: string;
  fileUrl: string;
  title: string;
  postId: string;
  type: string;
}

export function ImagesTab({ username }: { username: string }) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/profile/${username}/posts`)
      .then((r) => r.json())
      .then((data) => {
        const imgs = (data.posts ?? []).flatMap((post: any) =>
          (post.documents ?? [])
            .filter((d: any) => d.type === "IMAGE" || d.type === "VIDEO")
            .map((d: any) => ({ id: d.id, fileUrl: d.fileUrl, title: d.title, postId: post.id, type: d.type })),
        );
        setImages(imgs);
        setNextCursor(data.nextCursor);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username]);

  const loadMore = async () => {
    if (!nextCursor) return;
    const res = await fetch(`/api/profile/${username}/posts?cursor=${nextCursor}`);
    const data = await res.json();
    const more = (data.posts ?? []).flatMap((post: any) =>
      (post.documents ?? [])
        .filter((d: any) => d.type === "IMAGE" || d.type === "VIDEO")
        .map((d: any) => ({ id: d.id, fileUrl: d.fileUrl, title: d.title, postId: post.id, type: d.type })),
    );
    setImages((prev) => [...prev, ...more]);
    setNextCursor(data.nextCursor);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square bg-surface border border-surface-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-surface border border-surface-200 rounded-2xl p-8 text-center">
        <p className="text-text-muted text-sm">Chưa có hình ảnh nào.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {images.map((img) =>
          img.type === "VIDEO" ? (
            <div key={img.id} className="aspect-square rounded-2xl overflow-hidden bg-black relative">
              <video src={img.fileUrl} muted preload="metadata" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          ) : (
            <a key={img.id} href={img.fileUrl} target="_blank" rel="noopener noreferrer"
              className="aspect-square rounded-2xl overflow-hidden bg-surface-100 block group">
              <img src={img.fileUrl} alt={img.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </a>
          ),
        )}
      </div>
      {nextCursor && (
        <button onClick={loadMore} className="text-xs text-primary font-medium py-2 hover:opacity-70 transition-opacity text-center">
          Tải thêm →
        </button>
      )}
    </div>
  );
}