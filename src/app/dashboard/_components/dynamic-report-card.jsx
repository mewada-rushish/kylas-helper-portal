"use client";

import { useState, useRef, useEffect } from "react";
import { FiMoreHorizontal, FiBarChart2, FiTrendingUp, FiHash, FiTrash2, FiTrendingDown, FiActivity, FiArrowUpRight } from "react-icons/fi";
import Sparkline from "@/components/ui/charts/sparkline";
import BarChart from "@/components/ui/charts/bar-chart";
import styles from "./dynamic-report.module.css";

export default function DynamicReportCard({ 
  widget, isEditing, isBeingDragged, onUpdateWidget, onRemoveWidget,
  onDragStart, onDragEnter, onDragOver, onDragEnd
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dataArray = Array.isArray(widget.data) ? widget.data : [0];
  const lastValue = dataArray[dataArray.length - 1] || 0;
  const firstValue = dataArray[0] || 0;
  const percentChange = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  const totalValue = dataArray.reduce((a, b) => a + b, 0);

  const getMetricLabel = () => {
    if (widget.id.includes("revenue") || widget.id.includes("pipeline")) return "INR (₹)";
    if (widget.id.includes("conversions") || widget.id.includes("health")) return "Percentage (%)";
    if (widget.id.includes("volume")) return "Invoices Issued";
    return "Total Ingested Leads";
  };

  const formatDisplayValue = (val) => {
    if (widget.id.includes("revenue") || widget.id.includes("pipeline")) {
      return `₹${val.toLocaleString("en-IN")}`;
    }
    if (widget.id.includes("conversions") || widget.id.includes("health")) {
      return `${val}%`;
    }
    return val.toLocaleString();
  };

  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialWidth = cardRef.current.offsetWidth;
    const initialHeight = cardRef.current.offsetHeight;

    const currentCols = parseInt(widget.size.split("x")[0]);
    const currentRows = parseInt(widget.size.split("x")[1]);

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const colDelta = Math.round(deltaX / 280);
      const rowDelta = Math.round(deltaY / 160);

      let newCols = Math.max(1, Math.min(3, currentCols + colDelta));
      let newRows = Math.max(1, Math.min(2, currentRows + rowDelta));

      const newSize = `${newCols}x${newRows}`;
      if (newSize !== widget.size) {
        onUpdateWidget(widget.id, { size: newSize });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div 
      ref={cardRef}
      className={`${styles.reportCard} ${styles[`card_${widget.size}`]} ${isEditing ? styles.editableGlow : ""} ${isBeingDragged ? styles.isDragging : ""} ${menuOpen ? styles.menuActiveLayer : ""}`}
      draggable={isEditing}
      onDragStart={(e) => isEditing && onDragStart(e, widget.id)}
      onDragEnter={(e) => isEditing && onDragEnter(e, widget.id)}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{widget.title}</h3>
        <div className={styles.actionMenuWrapper} ref={menuRef}>
          <button type="button" className={styles.menuTrigger} onClick={() => setMenuOpen(!menuOpen)}><FiMoreHorizontal /></button>
          {menuOpen && (
            <ul className={styles.dropdownList}>
              <li className={styles.menuSectionLabel}>Visualization</li>
              <li className={widget.currentVis === "line" ? styles.activeOption : ""} onClick={() => { onUpdateWidget(widget.id, { currentVis: "line" }); setMenuOpen(false); }}><FiTrendingUp /> Line Chart</li>
              <li className={widget.currentVis === "bar" ? styles.activeOption : ""} onClick={() => { onUpdateWidget(widget.id, { currentVis: "bar" }); setMenuOpen(false); }}><FiBarChart2 /> Bar Chart</li>
              <li className={widget.currentVis === "summary" ? styles.activeOption : ""} onClick={() => { onUpdateWidget(widget.id, { currentVis: "summary" }); setMenuOpen(false); }}><FiHash /> Premium KPI View</li>
              <li className={styles.menuDivider} />
              <li className={styles.deleteOption} onClick={() => { onRemoveWidget(widget.id); setMenuOpen(false); }}><FiTrash2 /> Remove Widget</li>
            </ul>
          )}
        </div>
      </div>

      <div className={styles.cardBody}>
         {widget.currentVis === "line" ? (
           <div className={styles.chartContainer}><Sparkline data={dataArray} color="#27347B" /></div>
         ) : widget.currentVis === "bar" ? (
           <div className={styles.chartContainer}><BarChart data={dataArray} color="#27347B" /></div>
         ) : (
           <div className={styles.premiumKpiCanvas}>
             <div className={styles.kpiRowHeader}>
               <span className={styles.kpiMetricBadge}>{getMetricLabel()}</span>
               <span className={`${styles.trendBadge} ${percentChange >= 0 ? styles.trendUp : styles.trendDown}`}>
                 {percentChange >= 0 ? <FiArrowUpRight /> : <FiTrendingDown />}
                 {Math.abs(percentChange).toFixed(1)}%
               </span>
             </div>
             <div className={styles.kpiValueWrapper}>
               <span className={styles.premiumKpiValue}>{formatDisplayValue(widget.size === "1x1" ? lastValue : totalValue)}</span>
               <span className={styles.kpiContextLabel}>
                 {widget.size === "1x1" ? "Current Interval Velocity" : "Aggregated Pipeline Volume"}
               </span>
             </div>
           </div>
         )}
      </div>

      {isEditing && (
        <div 
          className={styles.photoshopResizeHandle}
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
}