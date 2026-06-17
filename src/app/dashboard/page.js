"use client";

import { useState, useRef } from "react";
import { 
  FiLayout, FiCheck, FiPlus, FiTrash2, FiSettings, FiCreditCard, FiActivity, FiEdit3 
} from "react-icons/fi";
import Sidebar from "@/components/layout/sidebar/sidebar";
import Accordion from "@/components/ui/accordion/accordion";
import AdminButton from "@/components/ui/button/button";
import CustomDatePicker from "@/components/ui/date-picker/date-picker";
import DynamicReportCard from "./_components/dynamic-report-card";
import { REPORT_CATALOG, MOCK_DATA_ENGINE } from "./_components/report-registry";
import styles from "./page.module.css";

export default function MasterDashboard() {
  const [dateRange, setDateRange] = useState({ preset: "last_week", start: null, end: null });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState(null);
  const [activeWidgetIds, setActiveWidgetIds] = useState(REPORT_CATALOG.map(r => r.id));
  const [widgetsMetadata, setWidgetsMetadata] = useState(() =>
    REPORT_CATALOG.map(report => ({
      id: report.id,
      size: report.defaultSize,
      currentVis: report.defaultVis
    }))
  );

  const workflowRef = useRef(null);
  const invoiceRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleUpdateWidgetMetadata = (id, updates) => setWidgetsMetadata(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  const handleRemoveWidget = (id) => setActiveWidgetIds(prev => prev.filter(wId => wId !== id));
  const handleAddWidget = (id) => !activeWidgetIds.includes(id) && setActiveWidgetIds(prev => [...prev, id]);

  const handleSaveLayoutChanges = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleDragStart = (e, id) => {
    setDraggedWidgetId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id); 
  };

  const handleDragEnter = (e, targetId) => {
    e.preventDefault();
    if (!draggedWidgetId || draggedWidgetId === targetId) return;

    setActiveWidgetIds(prev => {
      const newOrder = [...prev];
      const sourceIndex = newOrder.indexOf(draggedWidgetId);
      const targetIndex = newOrder.indexOf(targetId);
      newOrder.splice(sourceIndex, 1);
      newOrder.splice(targetIndex, 0, draggedWidgetId);
      return newOrder;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
  };

  const renderBentoGrid = (partition) => {
    const widgets = activeWidgetIds
      .map(id => REPORT_CATALOG.find(r => r.id === id))
      .filter(Boolean)
      .filter(report => report.partition === partition)
      .map(report => {
        const metadata = widgetsMetadata.find(m => m.id === report.id);
        return {
          ...report,
          size: metadata?.size || report.defaultSize,
          currentVis: metadata?.currentVis || report.defaultVis,
          data: MOCK_DATA_ENGINE[report.id]?.[dateRange.preset] || []
        };
      });

    if (widgets.length === 0) {
      return <div className={styles.emptyDashboardState}>No widgets pinned to this section.</div>;
    }

    return (
      <div className={styles.bentoGridSystem}>
        {widgets.map(widget => (
          <DynamicReportCard 
            key={widget.id}
            widget={widget}
            isEditing={isEditing}
            isBeingDragged={draggedWidgetId === widget.id}
            onUpdateWidget={handleUpdateWidgetMetadata}
            onRemoveWidget={handleRemoveWidget}
            onDragStart={handleDragStart}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>
    );
  };

  const sidebarMenuItems = [
    { id: "canvas", label: "Overview Canvas", icon: FiLayout, onClick: null },
    { id: "workflows", label: "Workflows", icon: FiActivity, onClick: () => scrollToSection(workflowRef) },
    { id: "invoices", label: "Invoices & ERP", icon: FiCreditCard, onClick: () => scrollToSection(invoiceRef) },
    { id: "settings", label: "Settings", icon: FiSettings, disabled: true }
  ];

  return (
    <div className={styles.adminLayout}>
      <Sidebar items={sidebarMenuItems} activeId="canvas" />

      <main className={styles.mainCanvas}>
        <div className={styles.pageMaxWidth}>
          <header className={styles.pageHeader}>
            <div className={styles.headerTitle}>
              <h1>Unified Operations Dashboard</h1>
            </div>
            
            <div className={styles.headerActions}>
              <CustomDatePicker value={dateRange.preset} onRangeChange={(range) => setDateRange(range)} />
              <AdminButton 
                variant="primary" 
                icon={isEditing ? FiCheck : FiEdit3}
                loading={isSaving}
                loadingText="Saving..."
                onClick={isEditing ? handleSaveLayoutChanges : () => setIsEditing(true)}
              >
                {isEditing ? "Save Layout" : "Edit Layout"}
              </AdminButton>
            </div>
          </header>

          {isEditing && (
            <div className={styles.customizerAlertCard}>
              <div className={styles.alertContent}>
                <h3>Dashboard Component Library</h3>
                <p>Add or remove reports. Drag cards physically in the grid below to reorder them, and use their top-right menu to resize.</p>
                <div className={styles.catalogLibraryGrid}>
                  {REPORT_CATALOG.map(report => {
                    const isPinned = activeWidgetIds.includes(report.id);
                    return (
                      <div key={report.id} className={styles.catalogLibraryCard}>
                        <div className={styles.catalogCardInfo}>
                          <span className={styles.catalogCardTitle}>{report.title}</span>
                          <span className={styles.catalogCardBadge}>{isPinned ? "Pinned" : "Available"}</span>
                        </div>
                        {isPinned ? (
                          <button className={styles.removeReportActionBtn} onClick={() => handleRemoveWidget(report.id)}><FiTrash2 /></button>
                        ) : (
                          <button className={styles.addReportActionBtn} onClick={() => handleAddWidget(report.id)}><FiPlus /></button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className={styles.pageContent}>
            <div ref={workflowRef} className={styles.sectionScrollOffset}>
              <Accordion title="Workflow Telemetry" icon={FiActivity}>
                {renderBentoGrid("workflows")}
              </Accordion>
            </div>

            <div ref={invoiceRef} className={styles.sectionScrollOffset}>
              <Accordion title="Financial ERP Ledger (BBPS)" icon={FiCreditCard}>
                {renderBentoGrid("invoices")}
              </Accordion>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}