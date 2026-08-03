"use client";

export function ClashBurst() {
  return (
    <div className="relative mx-auto h-16 w-24" aria-hidden="true">
      <svg viewBox="0 0 96 64" className="kc-clash-flash absolute inset-0 h-full w-full">
        <circle cx="48" cy="28" r="22" fill="#C6FF3D" opacity="0.35" />
      </svg>
      <svg viewBox="0 0 96 64" className="absolute inset-0 h-full w-full">
        <rect
          x="14"
          y="18"
          width="30"
          height="20"
          rx="4"
          fill="#7C3AED"
          className="kc-clash-left"
        />
        <rect
          x="52"
          y="18"
          width="30"
          height="20"
          rx="4"
          fill="#C6FF3D"
          className="kc-clash-right"
        />
      </svg>
    </div>
  );
}
