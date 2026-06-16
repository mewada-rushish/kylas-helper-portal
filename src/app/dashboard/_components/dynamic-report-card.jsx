"use client";

import { useState, useRef, useEffect } from "react";
import { FiMoreHorizontal, FiBarChart2, FiTrendingUp, FiHash, FiTrash2, FiMaximize } from "react-icons/fi";
import Sparkline from "@/components/ui/charts/sparkline";
import BarChart from "@/components/ui/charts/bar-chart";
import styles from "./dynamic-report.module.css";

export default function DynamicReportCard({ 
  widget, isEditing, isBeingDragged, onUpdateWidget, onRemoveWidget,
  onDragStart, onDragEnter, onDragOver, onDragEnd
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
      className={`${styles.reportCard} ${styles[`card_${widget.size}`]} ${isEditing ? styles.editableGlow : ""} ${isBeingDragged ? styles.isDragging : ""}`}
      draggable={isEditing}
      onDragStart={(e) => isEditing && onDragStart(e, widget.id)}
      onDragEnter={(e) => isEditing && onDragEnter(e, widget.id)}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{widget.title}</h3>
        <button className={styles.menuTrigger} onClick={() => setMenuOpen(!menuOpen)}><FiMoreHorizontal /></button>
        {menuOpen && (
          <ul className={styles.dropdownList}>
            <li onClick={() => { onUpdateWidget(widget.id, { currentVis: "line" }); setMenuOpen(false); }}><FiTrendingUp /> Line</li>
            <li onClick={() => { onUpdateWidget(widget.id, { currentVis: "bar" }); setMenuOpen(false); }}><FiBarChart2 /> Bar</li>
            <li onClick={() => { onUpdateWidget(widget.id, { currentVis: "summary" }); setMenuOpen(false); }}><FiHash /> KPI</li>
          </ul>
        )}
      </div>
      <div className={styles.cardBody}>
         {widget.currentVis === "line" ? <Sparkline data={widget.data} color="#27347B" /> : 
          widget.currentVis === "bar" ? <BarChart data={widget.data} color="#27347B" /> :
          <div className={styles.summaryValueContainer}><span className={styles.summaryValue}>{widget.data[0]}</span></div>}
      </div>
    </div>
  );
}