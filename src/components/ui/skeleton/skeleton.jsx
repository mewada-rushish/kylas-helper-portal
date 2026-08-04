import React from "react";
import styles from "./skeleton.module.css";

export default function SkeletonLoader({ type = "table", rows = 5, columns = 5 }) {
  if (type === "table") {
    return (
      <>
        {Array.from({ length: rows }).map((_, index) => (
          <tr key={index} className={styles.tableRow}>
            {Array.from({ length: columns }).map((_, colIndex) => {
              if (colIndex === 0) {
                return (
                  <td key={colIndex} className={styles.tableCell}>
                    <div className={styles.tableCellInner}>
                      <div className={`${styles.blockPrimary} ${styles.skeletonPulse}`}></div>
                      <div className={`${styles.blockSecondary} ${styles.skeletonPulse}`}></div>
                    </div>
                  </td>
                );
              }
              if (colIndex === columns - 1) {
                return (
                  <td key={colIndex} className={styles.tableCell}>
                    <div className={`${styles.blockAction} ${styles.skeletonPulse}`}></div>
                  </td>
                );
              }
              return (
                <td key={colIndex} className={styles.tableCell}>
                  <div className={`${styles.blockBadge} ${styles.skeletonPulse}`}></div>
                </td>
              );
            })}
          </tr>
        ))}
      </>
    );
  }

  if (type === "div-table") {
    return (
      <>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className={styles.tableRow} style={{ display: 'flex', width: '100%' }}>
            {Array.from({ length: columns }).map((_, colIndex) => {
              if (colIndex === 0) {
                return (
                  <div key={colIndex} className={styles.tableCell} style={{ flex: 2 }}>
                    <div className={styles.tableCellInner}>
                      <div className={`${styles.blockPrimary} ${styles.skeletonPulse}`}></div>
                      <div className={`${styles.blockSecondary} ${styles.skeletonPulse}`}></div>
                    </div>
                  </div>
                );
              }
              if (colIndex === columns - 1) {
                return (
                  <div key={colIndex} className={styles.tableCell} style={{ flex: 1 }}>
                    <div className={`${styles.blockAction} ${styles.skeletonPulse}`}></div>
                  </div>
                );
              }
              return (
                <div key={colIndex} className={styles.tableCell} style={{ flex: 1 }}>
                  <div className={`${styles.blockBadge} ${styles.skeletonPulse}`}></div>
                </div>
              );
            })}
          </div>
        ))}
      </>
    );
  }

  if (type === "card") {
    return (
      <div className={styles.cardSkeleton}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardTitle} ${styles.skeletonPulse}`}></div>
          <div className={`${styles.cardIcon} ${styles.skeletonPulse}`}></div>
        </div>
        <div className={`${styles.cardMetric} ${styles.skeletonPulse}`}></div>
        <div className={`${styles.cardFooter} ${styles.skeletonPulse}`}></div>
      </div>
    );
  }

  return null;
}
