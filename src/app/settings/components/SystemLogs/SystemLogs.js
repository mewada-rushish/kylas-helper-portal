"use client";

import React, { useState, useEffect } from "react";
import { FiSearch, FiPlay, FiAlertCircle, FiTerminal } from "react-icons/fi";
import CustomDropdown from "@/components/ui/dropdown/dropdown";
import styles from "./SystemLogs.module.css";

const INITIAL_LOGS = [
  { id: "log_01", timestamp: "2026-06-30 10:15:22", source: "Kylas CRM", severity: "error", message: "Validation Gate intercepted: Trigger payload missing compulsory field property 'root.mpEntityId'." },
  { id: "log_02", timestamp: "2026-06-30 10:14:05", source: "Core Render", severity: "success", message: "A4 Printable Account Statement Blueprint for INV-2026-089 rendered successfully within 142ms." },
  { id: "log_03", timestamp: "2026-06-30 09:44:12", source: "BBPS Gateway", severity: "warning", message: "Outbound Webhook delayed response. Network socket pipe latency bounds exceeded threshold (800ms)." },
  { id: "log_04", timestamp: "2026-06-30 08:12:59", source: "Kylas CRM", severity: "success", message: "Webhook hook 'wh_config_kylas_crm_leads' resolved successfully. Dynamic context data hydrated cleanly." }
];

export default function SystemLogs({ setLogsCount }) {
  const [logs] = useState(INITIAL_LOGS);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeInspectedLog, setActiveInspectedLog] = useState(null);

  const severityOptions = [
    { value: "all", label: "All Levels" },
    { value: "success", label: "Success" },
    { value: "warning", label: "Warning" },
    { value: "error", label: "Errors" }
  ];

  const sourceOptions = [
    { value: "all", label: "All Channels" },
    { value: "Kylas CRM", label: "Kylas CRM" },
    { value: "Core Render", label: "Core Render" },
    { value: "BBPS Gateway", label: "BBPS Gateway" }
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;
    const matchesSource = sourceFilter === "all" || log.source === sourceFilter;
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSource && matchesSearch;
  });

  useEffect(() => {
    if (setLogsCount) {
      setLogsCount(filteredLogs.length);
    }
  }, [filteredLogs, setLogsCount]);

  return (
    <div className={styles.logsConsoleContainerFlexEngine}>
      
      {/* FILTER CONTROL BAR STRIP */}
      <div className={styles.logsFiltersStripControlPanel}>
        <div className={styles.searchFilterInputBoxWrapper}>
          <FiSearch className={styles.searchInnerDecorativeIcon} />
          <input 
            type="text" 
            placeholder="Search log trace messages or IDs..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className={styles.logSearchInputField}
          />
        </div>
        
        <div className={styles.selectFilterControlBlock}>
          <span className={styles.filterControlTitleText}>Severity</span>
          <div className={styles.dropdownWrapperOverride}>
            <CustomDropdown 
              options={severityOptions}
              selectedValue={severityFilter}
              onSelect={(val) => setSeverityFilter(val)}
              icon={FiAlertCircle}
            />
          </div>
        </div>

        <div className={styles.selectFilterControlBlock}>
          <span className={styles.filterControlTitleText}>Channel</span>
          <div className={styles.dropdownWrapperOverride}>
            <CustomDropdown 
              options={sourceOptions}
              selectedValue={sourceFilter}
              onSelect={(val) => setSourceFilter(val)}
              icon={FiTerminal}
            />
          </div>
        </div>
      </div>

      {/* RENDER DATA TABLE GRID CONTAINER */}
      <div className={styles.logsTerminalScrollCanvasTable}>
        <div className={styles.logsGridTableHeaderRow}>
          <span className={styles.colLogTimestamp}>Timestamp</span>
          <span className={styles.colLogSource}>Origin Source</span>
          <span className={styles.colLogSeverity}>Severity</span>
          <span className={styles.colLogMessage}>Diagnostic Log Context Message</span>
          <span className={styles.colLogActions}>Actions</span>
        </div>
        
        <div className={styles.logsGridTableBodyDataScroller}>
          {filteredLogs.map(log => (
            <div 
              key={log.id} 
              className={`${styles.logsGridDataRowWrapper} ${activeInspectedLog?.id === log.id ? styles.activeInspectedRowHighlight : ""}`} 
              onClick={() => setActiveInspectedLog(log)}
            >
              <span className={styles.colLogTimestamp}>{log.timestamp}</span>
              <span className={styles.colLogSource}>
                <code className={styles.codeSnippetTagBadge}>{log.source}</code>
              </span>
              <span className={styles.colLogSeverity}>
                <span className={`${styles.severityBadgePill} ${styles[log.severity]}`}>
                  {log.severity.toUpperCase()}
                </span>
              </span>
              <span className={styles.colLogMessage}>{log.message}</span>
              <span className={styles.colLogActions}>
                <button 
                  type="button" 
                  className={styles.tableRowReplayActionBtn} 
                  onClick={(e) => { e.stopPropagation(); alert(`Replaying tracking pipeline event context: ${log.id}`); }}
                >
                  <FiPlay size={10} />
                  <span>Replay</span>
                </button>
              </span>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className={styles.emptyLogsFallbackCenterRow}>
              No ecosystem event traces found matching execution constraints.
            </div>
          )}
        </div>
      </div>

      {/* INSPECTION SLIDEOUT FOOTER PANEL */}
      {activeInspectedLog && (
        <div className={styles.inspectedJsonSummarySlideDrawerWindow}>
          <div className={styles.drawerHeaderFlexLine}>
            <h3>Trace Inspector JSON Object Matrix: {activeInspectedLog.id}</h3>
            <button 
              type="button" 
              className={styles.closeDrawerActionBtn} 
              onClick={() => setActiveInspectedLog(null)}
            >
              Dismiss View
            </button>
          </div>
          <div className={styles.drawerCodeBlockTerminalBox}>
            <pre>{JSON.stringify(activeInspectedLog, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}