"use client";

import { clsx } from "clsx";
import { isVideoItem } from "@/lib/feed/utils";

function MediaThumb({
  src,
  mediaType,
  onClick,
  className,
  overlay,
}: {
  src: string;
  mediaType?: string;
  onClick: () => void;
  className?: string;
  overlay?: React.ReactNode;
}) {
  const isVideo = isVideoItem(src, mediaType);
  return (
    <div
      className={clsx(
        "relative overflow-hidden cursor-pointer group",
        className,
      )}
      onClick={onClick}
    >
      {isVideo ? (
        <video
          src={src}
          muted
          preload="metadata"
          className="w-full h-full object-cover group-hover:brightness-90 transition"
        />
      ) : (
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover group-hover:brightness-95 transition"
        />
      )}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-black/50 dark:bg-black/35 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
      {overlay}
    </div>
  );
}

export default function ImageGrid({
  images,
  mediaTypes,
  onImageClick,
  maxImageHeight = "500px",
}: {
  images: string[];
  mediaTypes?: string[];
  onImageClick: (index: number) => void;
  maxImageHeight?: string;
}) {
  const extraCount = images.length - 3;

  if (images.length === 1) {
    const isVideo = isVideoItem(images[0], mediaTypes?.[0]);
    return (
      <div
        className="mb-3 rounded-xl overflow-hidden bg-black flex items-center justify-center"
        onClick={() => onImageClick(0)}
      >
        {isVideo ? (
          <video
            src={images[0]}
            muted
            preload="metadata"
            style={{ maxHeight: maxImageHeight }}
            className="w-full object-contain cursor-pointer"
          />
        ) : (
          <img
            src={images[0]}
            alt=""
            style={{ maxHeight: maxImageHeight }}
            className="w-full object-contain cursor-pointer"
          />
        )}
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
        {images.map((src, i) => (
          <MediaThumb
            key={i}
            src={src}
            mediaType={mediaTypes?.[i]}
            onClick={() => onImageClick(i)}
            className="w-full h-44"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
      <MediaThumb
        src={images[0]}
        mediaType={mediaTypes?.[0]}
        onClick={() => onImageClick(0)}
        className="w-full row-span-2 h-[244px]"
      />
      <MediaThumb
        src={images[1]}
        mediaType={mediaTypes?.[1]}
        onClick={() => onImageClick(1)}
        className="w-full h-[120px]"
      />
      <MediaThumb
        src={images[2]}
        mediaType={mediaTypes?.[2]}
        onClick={() => onImageClick(2)}
        className="w-full h-[120px]"
        overlay={
          extraCount > 0 ? (
            <div className="absolute inset-0 bg-black/50 dark:bg-black/35 flex items-center justify-center text-white font-bold text-xl pointer-events-none">
              +{extraCount}
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
