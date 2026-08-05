"use client";

import React, { useState, useEffect } from "react";
import { FiSearch, FiPlay, FiAlertCircle, FiTerminal, FiRefreshCw } from "react-icons/fi";
import CustomDropdown from "@/components/ui/dropdown/dropdown";
import SkeletonLoader from "@/components/ui/skeleton/skeleton";
import toast from "react-hot-toast";
import styles from "./SystemLogs.module.css";

// No INITIAL_LOGS anymore

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeInspectedLog, setActiveInspectedLog] = useState(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings/logs");
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      
      const formattedLogs = data.map(log => {
        const dateObj = new Date(log.createdAt);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const hh = String(dateObj.getHours()).padStart(2, '0');
        const min = String(dateObj.getMinutes()).padStart(2, '0');
        const ss = String(dateObj.getSeconds()).padStart(2, '0');
        let parsedDetails = null;
        if (log.details) {
          try {
            parsedDetails = JSON.parse(log.details);
          } catch(e) {
            parsedDetails = log.details;
          }
        }
        
        return {
          id: log.id,
          timestamp: `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`,
          source: log.source,
          severity: log.severity,
          message: log.message,
          ...(parsedDetails && { details: parsedDetails })
        };
      });
      setLogs(formattedLogs);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const severityOptions = [
    { value: "all", label: "All Levels" },
    { value: "success", label: "Success" },
    { value: "warning", label: "Warning" },
    { value: "error", label: "Errors" }
  ];

  const sourceOptions = [
    { value: "all", label: "All Channels" },
    { value: "General Settings", label: "General Settings" },
    { value: "Incoming Webhooks", label: "Incoming Webhooks" },
    { value: "Automation Workflows", label: "Automation Workflows" }
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;
    const matchesSource = sourceFilter === "all" || log.source === sourceFilter;
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSource && matchesSearch;
  });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [severityFilter, sourceFilter, searchQuery]);

  // Calculate paginated logs
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );



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
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={fetchLogs} 
            className={styles.refreshBtn} 
            title="Refresh Logs"
            disabled={isLoading}
          >
            <FiRefreshCw size={14} className={isLoading ? styles.spinningIcon : ''} />
          </button>
          
          <div className={styles.selectFilterControlBlock}>
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
          {isLoading ? (
            <SkeletonLoader type="div-table" rows={4} columns={5} />
          ) : (
            paginatedLogs.map(log => (
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
                  <span className={`${styles.severityBadgePill} ${log.severity}`}>
                    {log.severity.toUpperCase()}
                  </span>
                </span>
                <span className={styles.colLogMessage}>{log.message}</span>
                <span className={styles.colLogActions}>
                  <button 
                    type="button" 
                    className={styles.tableRowReplayActionBtn} 
                    onClick={(e) => { e.stopPropagation(); toast.success(`Replaying tracking pipeline event context: ${log.id}`); }}
                  >
                    <FiPlay size={10} />
                    <span>Replay</span>
                  </button>
                </span>
              </div>
            ))
          )}
          
          {!isLoading && filteredLogs.length === 0 && (
            <div className={styles.logsEmptyDatasetAlertPlate}>
              <FiTerminal size={48} />
              <p>No diagnostic events match current pipeline filter sequence</p>
            </div>
          )}
        </div>
      </div>

      {/* PAGINATION CONTROLS */}
      {!isLoading && totalPages > 1 && (
        <div className={styles.paginationControlsContainer}>
          <button 
            type="button"
            className={styles.paginationBtn}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className={styles.paginationStatusText}>
            Page {currentPage} of {totalPages}
          </span>
          <button 
            type="button"
            className={styles.paginationBtn}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* INSPECTION SLIDEOUT FOOTER PANEL */}
      {activeInspectedLog && (
        <div className={styles.inspectedJsonSummarySlideDrawerWindow}>
          <div className={styles.drawerHeaderFlexLine}>
            <h3 className={styles.drawerTitleComplex}>
              <span className={`${styles.severityBadgePill} ${activeInspectedLog.severity}`} style={{ marginRight: '10px' }}>
                {activeInspectedLog.severity.toUpperCase()}
              </span>
              <span className={styles.drawerTitleSource}>{activeInspectedLog.source}</span>
              <span className={styles.drawerTitleTime}> • {activeInspectedLog.timestamp}</span>
              <span className={styles.drawerTitleId}> (Trace: {activeInspectedLog.id})</span>
            </h3>
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