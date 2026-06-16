"use client";

import styles from "./charts.module.css";

export default function BarChart({ data, color = "#27347B" }) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data) || 1;

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.barChartContainer}>
        {data.map((val, i) => {
          const height = `${(val / max) * 100}%`;
          return (
            <div key={i} className={styles.barColumn}>
              <div className={styles.barFill} style={{ height, backgroundColor: color }} />
            </div>
          );
        })}
      </div>
      <div className={styles.chartXAxis}>
        <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span>
      </div>
    </div>
  );
}