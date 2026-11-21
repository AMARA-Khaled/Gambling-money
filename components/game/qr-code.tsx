"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function JoinQR({ code }: { code: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}/join?code=${code}`;
    QRCode.toDataURL(url, {
      margin: 1,
      width: 220,
      color: { dark: "#0a0f0d", light: "#ffffff" },
    })
      .then(setSrc)
      .catch(() => setSrc(null));
  }, [code]);

  if (!src) {
    return (
      <div className="h-[180px] w-[180px] animate-pulse-slow rounded-xl bg-surface-2" />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Scan to join"
      width={180}
      height={180}
      className="rounded-xl bg-white p-1"
    />
  );
}
