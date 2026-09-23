"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface ImageItem {
  id: string;
  fileUrl: string;
  title: string;
  postId: string;
  type: string;
}

function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: ImageItem[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  const prev = () => setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  const next = () => setIndex((i) => (i < images.length - 1 ? i + 1 : 0));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const current = images[index];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition z-10"
      >
        <X size={16} />
      </button>

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      <div
        className="w-full h-full flex items-center justify-center px-16"
        onClick={(e) => e.stopPropagation()}
      >
        {current.type === "VIDEO" ? (
          <video
            key={current.fileUrl}
            src={current.fileUrl}
            controls
            autoPlay
            className="object-contain max-w-full max-h-full"
          />
        ) : (
          <img
            src={current.fileUrl}
            alt={current.title}
            className="object-contain max-w-full max-h-full"
          />
        )}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
                className={clsx(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  i === index ? "bg-surface scale-125" : "bg-white/40",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ImagesTab({ username }: { username: string }) {
  const t = useTranslations("profile.imagesTab");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
        <p className="text-text-muted text-sm">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, i) =>
          img.type === "VIDEO" ? (
            <button
              key={img.id}
              onClick={() => setLightboxIndex(i)}
              className="aspect-square rounded-2xl overflow-hidden bg-black relative"
            >
              <video src={img.fileUrl} muted preload="metadata" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
          ) : (
            <button
              key={img.id}
              onClick={() => setLightboxIndex(i)}
              className="aspect-square rounded-2xl overflow-hidden bg-surface-100 block group"
            >
              <img src={img.fileUrl} alt={img.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </button>
          ),
        )}
      </div>
      {nextCursor && (
        <button onClick={loadMore} className="text-xs text-primary font-medium py-2 hover:opacity-70 transition-opacity text-center">
          {t("loadMore")}
        </button>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}