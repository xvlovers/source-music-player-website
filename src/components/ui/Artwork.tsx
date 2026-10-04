"use client";

import { Music } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils/cn";
import { isHttpUrl } from "@/lib/utils/url";

interface ArtworkProps {
  src: string | null;
  /**
   * Use "" when the title is shown next to the artwork (decorative image).
   * A non-empty alt also labels the fallback.
   */
  alt: string;
  /** Pixel size, or "fill" for full width with a square aspect ratio. */
  size?: number | "fill";
  className?: string;
}

/**
 * Cover image with a light built-in fallback (no external placeholder).
 * A plain <img> is used on purpose: artwork hosts depend on the provider and
 * are not known at build time, so next/image remotePatterns cannot be set.
 */
export function Artwork({ src, alt, size = 48, className }: ArtworkProps) {
  // Remember which src failed: a new src is tried again, the same one never loops.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  // Artwork URLs come from providers or storage: only http(s) is ever loaded.
  const imageSrc = isHttpUrl(src) && failedSrc !== src ? src : null;
  const fixed = typeof size === "number" ? size : undefined;

  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-md bg-surface-elevated",
        size === "fill" && "aspect-square w-full",
        className,
      )}
      style={fixed === undefined ? undefined : { width: fixed, height: fixed }}
    >
      {imageSrc !== null ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={alt}
          width={fixed}
          height={fixed}
          loading="lazy"
          decoding="async"
          draggable={false}
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(imageSrc)}
          className="size-full object-cover"
        />
      ) : (
        <span
          role={alt === "" ? undefined : "img"}
          aria-label={alt === "" ? undefined : alt}
          aria-hidden={alt === "" ? true : undefined}
          className="flex size-full items-center justify-center text-muted"
        >
          <Music aria-hidden="true" className="size-1/2" />
        </span>
      )}
    </span>
  );
}
