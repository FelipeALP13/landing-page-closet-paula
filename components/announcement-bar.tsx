"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isExternalLink, type Announcement } from "@/lib/campaign";

const rotateEveryMs = 5000;

// Faixa do topo: mostra um aviso por vez e troca a cada 5 s. Pausa quando o mouse ou o foco está nela.
export function AnnouncementBar({ items }: { items: Announcement[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % items.length), reduceMotion ? rotateEveryMs * 2 : rotateEveryMs);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  if (!items.length) return null;
  const item = items[index % items.length];

  return (
    <div className="announcement" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <span key={index} className="announcement-item">
        {!item.link ? item.text
          : isExternalLink(item.link) ? <a href={item.link} target="_blank" rel="noopener noreferrer">{item.text} →</a>
          : <Link href={item.link}>{item.text} →</Link>}
      </span>
      {items.length > 1 && <span className="sr-only">Aviso {index % items.length + 1} de {items.length}</span>}
    </div>
  );
}
