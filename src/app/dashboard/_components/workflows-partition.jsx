"use client";

import { useState, useEffect } from "react";
import Sparkline from "@/components/ui/charts/sparkline";
import styles from "./partitions.module.css";

export default function WorkflowsPartition({ dateRange }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Simulate high-assurance database aggregation lookup based on selected interval
    setTimeout(() => {
      const telemetryMocks = {
        today: {
          volume: [12, 19, 15, 8, 22, 31, 45, 28, 34, 41, 52, 38],
          successRate: "99.8%",
          backlog: "2",
          activeRules: "14",
          trendLabel: "vs yesterday morning",
          comparisonMetric: "+12.4%"
        },
        yesterday: {
          volume: [34, 45, 23, 56, 43, 21, 34, 65, 43, 21, 11, 9],
          successRate: "99.2%",
          backlog: "0",
          activeRules: "14",
          trendLabel: "vs same day last week",
          comparisonMetric: "-3.1%"
        },
        last_week: {
          volume: [120, 150, 180, 140, 210, 250, 310],
          successRate: "99.1%",
          backlog: "12",
          activeRules: "12",
          trendLabel: "vs previous 7 days",
          comparisonMetric: "+24.0%"
        },
        this_month: {
          volume: [890, 1120, 950, 1340, 1420, 1680, 1510, 1890, 2100, 1950],
          successRate: "99.5%",
          backlog: "5",
          activeRules: "11",
          trendLabel: "vs last month total",
          comparisonMetric: "+8.6%"
        },
        custom: {
          volume: [45, 88, 92, 31, 67, 84, 110, 125],
          successRate: "99.6%",
          backlog: "4",
          activeRules: "14",
          trendLabel: "for selected duration",
          comparisonMetric: "Normalized"
        }
      };

      setData(telemetryMocks[dateRange.preset] || telemetryMocks.last_week);
      setIsLoading(false);
    }, 250);
  }, [dateRange]);

  if (isLoading) {
    return <div className={styles.partitionLoading}>Syncing workflow telemetry...</div>;
  }

  return (
    <div className={styles.partitionContainer}>
      
      {/* SECTION ANCHOR HEADER */}
      <div className={styles.partitionHeader}>
        <h2>Workflow Automation</h2>
        <p>Real-time routing logic engine tracking and webhook ingest performance.</p>
      </div>

      {/* METRIC SUBGRID */}
      <div className={styles.metricsGrid}>
        
        {/* LARGE TREND LINE WIDGET */}
        <div className={`${styles.telemetryCard} ${styles.cardLarge}`}>
          <div className={styles.cardMeta}>
            <span className={styles.cardLabel}>Ingestion Volume Flow</span>
            <div className={styles.headlineGroup}>
              <span className={styles.mainMetric}>{data.comparisonMetric}</span>
              <span className={styles.subLabel}>{data.trendLabel}</span>
            </div>
          </div>
          <div className={styles.chartWrapper}>
            <Sparkline data={data.volume} color="#2c6ecb" />
          </div>
        </div>

        {/* SMALL PULSE MATRIX WIDGETS */}
        <div className={styles.telemetryCard}>
          <span className={styles.cardLabel}>Delivery Success Rate</span>
          <span className={styles.mainMetric}>{data.successRate}</span>
          <div className={styles.statusFooter}>
            <span className={styles.dotActive} /> Operational Boundary
          </div>
        </div>

        <div className={styles.telemetryCard}>
          <span className={styles.cardLabel}>Queue Backlog</span>
          <span className={`${styles.mainMetric} ${parseInt(data.backlog) > 10 ? styles.metricAlert : ""}`}>
            {data.backlog}
          </span>
          <div className={styles.statusFooter}>
            Pending payloads
          </div>
        </div>

        <div className={styles.telemetryCard}>
          <span className={styles.cardLabel}>Active Routing Rules</span>
          <span className={styles.mainMetric}>{data.activeRules}</span>
          <div className={styles.statusFooter}>
            Prisma definitions live
          </div>
        </div>

      </div>

      {/* LOWER GRANULAR STREAM REGISTRY */}
      <div className={styles.registryCard}>
        <div className={styles.registryHeader}>
          <h3>Live Webhook Event Stream</h3>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Destination Node</th>
                <th>Status</th>
                <th>Handshake Latency</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.monoCell}>EVT-009923</td>
                <td>Kylas Lead Core API</td>
                <td><span className={styles.badgeSuccess}>Success</span></td>
                <td className={styles.monoCell}>34ms</td>
              </tr>
              <tr>
                <td className={styles.monoCell}>EVT-009924</td>
                <td>AsmitA Mobile ERP Push</td>
                <td><span className={styles.badgeSuccess}>Success</span></td>
                <td className={styles.monoCell}>18ms</td>
              </tr>
              <tr>
                <td className={styles.monoCell}>EVT-009925</td>
                <td>BBPS Validation Node</td>
                <td><span className={styles.badgeWarning}>Queued</span></td>
                <td className={styles.monoCell}>--</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}