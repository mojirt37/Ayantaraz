"use client";

import { useRef, useState } from "react";

/**
 * Video player with play/pause/seek/volume/fullscreen and no download
 * affordance (controlsList="nodownload", no download button rendered).
 * UI-level only: it does not and cannot make browser-side extraction
 * impossible, and we make no such claim.
 */
export function VideoPlayer({
  src,
  title,
  contentType,
}: Readonly<{ src: string; title: string; contentType: string }>) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  return (
    <div className="video-frame">
      {failed ? (
        <p className="error-text" role="alert">
          پخش این ویدئو در دسترس نیست؛ لطفاً بعداً تلاش کنید.
        </p>
      ) : (
        <video
          ref={ref}
          src={src}
          controls
          controlsList="nodownload"
          disablePictureInPicture={false}
          preload="metadata"
          playsInline
          aria-label={title}
          onError={() => setFailed(true)}
        >
          <source src={src} type={contentType} />
          مرورگر شما پخش ویدئو را پشتیبانی نمی‌کند.
        </video>
      )}
    </div>
  );
}
