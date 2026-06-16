"use client";

import { useState, useEffect } from "react";
import BarChart from "@/components/ui/charts/bar-chart";
import styles from "./partitions.module.css";

export default function InvoicesPartition({ dateRange }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Simulate high-assurance financial ERP aggregation lookup
    setTimeout(() => {
      const financialMocks = {
        today: {
          revenueChart: [5, 12, 0, 8, 45, 12, 18, 0, 25, 60, 10, 5],
          realizedRevenue: "₹18,500",
          pendingCollection: "₹4,200",
          docsGenerated: "24",
          trendLabel: "vs yesterday total collection",
          comparisonMetric: "+8.4%"
        },
        yesterday: {
          revenueChart: [15, 30, 45, 20, 10, 5, 40, 55, 20, 15, 30, 10],
          realizedRevenue: "₹42,100",
          pendingCollection: "₹12,800",
          docsGenerated: "58",
          trendLabel: "vs same day last week",
          comparisonMetric: "+14.2%"
        },
        last_week: {
          revenueChart: [45, 52, 48, 85, 42, 38, 45, 50, 95, 41, 39, 44],
          realizedRevenue: "₹2,84,500",
          pendingCollection: "₹65,000",
          docsGenerated: "342",
          trendLabel: "vs previous 7 days trend",
          comparisonMetric: "+19.1%"
        },
        this_month: {
          revenueChart: [120, 210, 180, 310, 280, 410, 390, 520, 480, 610],
          realizedRevenue: "₹12,45,000",
          pendingCollection: "₹1,85,000",
          docsGenerated: "1,428",
          trendLabel: "vs last month corporate billing",
          comparisonMetric: "+22.5%"
        },
        custom: {
          revenueChart: [70, 85, 60, 90, 110, 95, 130, 140],
          realizedRevenue: "₹4,12,000",
          pendingCollection: "₹92,000",
          docsGenerated: "490",
          trendLabel: "within selected custom dates",
          comparisonMetric: "Aggregated"
        }
      };

      setData(financialMocks[dateRange.preset] || financialMocks.last_week);
      setIsLoading(false);
    }, 250);
  }, [dateRange]);

  if (isLoading) {
    return <div className={styles.partitionLoading}>Syncing financial registry...</div>;
  }

  return (
    <div className={styles.partitionContainer}>
      
      {/* SECTION ANCHOR HEADER */}
      <div className={styles.partitionHeader}>
        <h2>Financial ERP & Invoicing</h2>
        <p>Automated billing loops, document generation counters, and BBPS processing registry.</p>
      </div>

      {/* FINANCIAL METRIC SUBGRID */}
      <div className={styles.metricsGrid}>
        
        {/* LARGE REVENUE DISTRIBUTION GRAPH */}
        <div className={`${styles.telemetryCard} ${styles.cardLarge}`}>
          <div className={styles.cardMeta}>
            <span className={styles.cardLabel}>Revenue Generation Timeline</span>
            <div className={styles.headlineGroup}>
              <span className={styles.mainMetric}>{data.comparisonMetric}</span>
              <span className={styles.subLabel}>{data.trendLabel}</span>
            </div>
          </div>
          <div className={styles.chartWrapper}>
            <BarChart data={data.revenueChart} color="#008060" />
          </div>
        </div>

        {/* METRIC VALUE GRID NODES */}
        <div className={styles.telemetryCard}>
          <span className={styles.cardLabel}>Realized Revenue</span>
          <span className={`${styles.mainMetric} ${styles.metricSuccess}`}>{data.realizedRevenue}</span>
          <div className={styles.statusFooter}>
            Settled bank clearings
          </div>
        </div>

        <div className={styles.telemetryCard}>
          <span className={styles.cardLabel}>Pending Collections</span>
          <span className={`${styles.mainMetric} ${styles.metricWarning}`}>{data.pendingCollection}</span>
          <div className={styles.statusFooter}>
            Outstanding invoice bounds
          </div>
        </div>

        <div className={styles.telemetryCard}>
          <span className={styles.cardLabel}>Documents Generated</span>
          <span className={styles.mainMetric}>{data.docsGenerated}</span>
          <div className={styles.statusFooter}>
            PDF receipts compiled
          </div>
        </div>

      </div>

      {/* INVOICE REGISTRY LEDGER */}
      <div className={styles.registryCard}>
        <div className={styles.registryHeader}>
          <h3>Recent Document Ledger</h3>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Client / Entity</th>
                <th>Amount</th>
                <th>Channel</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.monoCell}>INV-2026-088</td>
                <td>Acme Housing Society</td>
                <td className={styles.monoCell}>₹45,000</td>
                <td>BBPS Gateway</td>
                <td><span className={styles.badgeSuccess}>Paid</span></td>
              </tr>
              <tr>
                <td className={styles.monoCell}>INV-2026-089</td>
                <td>Globex Operations Ltd</td>
                <td className={styles.monoCell}>₹12,500</td>
                <td>Direct API Link</td>
                <td><span className={styles.badgeWarning}>Pending</span></td>
              </tr>
              <tr>
                <td className={styles.monoCell}>INV-2026-090</td>
                <td>Renaissance Residency</td>
                <td className={styles.monoCell}>₹88,000</td>
                <td>BBPS Gateway</td>
                <td><span className={styles.badgeSuccess}>Paid</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}