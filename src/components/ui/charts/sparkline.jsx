"use client";

import { useId } from "react";
import styles from "./charts.module.css";

export default function Sparkline({ data, color = "#27347B" }) {
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9]/g, "");

  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 8;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (((val - min) / range) * (100 - padding * 2) + padding);
    return `${x},${y}`;
  }).join(" ");

  const fillPoints = `0,100 ${points} 100,100`;

  return (
    <div className={styles.chartWrapper}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.svgChart}>
        <defs>
          <linearGradient id={`grad-${safeId}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={fillPoints} fill={`url(#grad-${safeId})`} />
        <polyline points={points} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className={styles.chartXAxis}>
        <span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span>
      </div>
    </div>
  );
}