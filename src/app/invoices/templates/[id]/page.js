// src/app/invoices/templates/[id]/page.js
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  FiPlus, FiTrash2, FiCheck, FiArrowLeft, FiSearch, FiCopy, FiMousePointer,
  FiBold, FiItalic, FiUnderline, FiLock, FiUnlock, FiZoomIn, FiZoomOut, FiSliders, FiGrid, FiBriefcase, FiAlignLeft, FiAlignCenter, FiAlignRight
} from "react-icons/fi";
import DOMPurify from "isomorphic-dompurify";
import Sidebar from "@/components/layout/sidebar/sidebar";
import AdminButton from "@/components/ui/button/button";
import Dropdown from "@/components/ui/dropdown/dropdown";
import styles from "./editor.module.css";
import { ELEMENT_REGISTRY, AVAILABLE_ASSETS } from "@/components/elements/registry";

const generateId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;

const KYLAS_PRODUCTS = [
  { value: "prod_crm_ent", label: "Kylas CRM Premium Enterprise License" },
  { value: "prod_iot_node", label: "Smart Home IoT Sensor Node (AsmitA Hub)" },
  { value: "prod_bbps_gw", label: "BBPS Settlement Core Gateway API" },
  { value: "prod_devops_supp", label: "Dedicated Cloud DevOps Maintenance Hours" }
];

const VARIABLE_DICTIONARY = [
  { token: "{{invoice.id}}", description: "Unique Document ID String" },
  { token: "{{customer.name}}", description: "Client Legal Entity Name" },
  { token: "{{customer.email}}", description: "Accounts Payable Target Email" },
  { token: "{{product.name}}", description: "Associated Kylas Product Name" },
  { token: "{{product.rate}}", description: "Base Item Unit Price" },
  { token: "{{product.qty}}", description: "Line Unit Quantity Count" },
  { token: "{{invoice.total}}", description: "Gross Total Amount Document Value" },
  { token: "{{current.date}}", description: "Current Issue Date" }
];

const DOC_DIMENSIONS = {
  a4: { portrait: { width: 794, height: 1123 }, landscape: { width: 1123, height: 794 } },
  letter: { portrait: { width: 816, height: 1056 }, landscape: { width: 1056, height: 816 } }
};

const INITIAL_DEFAULT_LAYOUT = [
  {
    sectionId: "sec_global_header",
    type: "layout_container",
    contentWidth: "boxed", columnsGap: "default", heightType: "auto", minHeight: 40, verticalAlign: "center", columnPosition: "middle", overflow: "visible", stretchSection: "no", htmlTag: "div",
    bgType: "color", backgroundColor: "#27347B", bgImage: "", bgPosition: "center-center", bgAttachment: "default", bgRepeat: "no-repeat", bgSize: "cover", overlayColor: "transparent", overlayOpacity: 0,
    borderStyle: "none", borderWidth: 0, borderRadius: 0, textColor: "#ffffff", headingColor: "#ffffff",
    marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0, paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24,
    zIndex: 1, cssId: "", cssClasses: "", animationType: "none", deviceVisibility: "all",
    columns: [
      {
        columnId: "col_header_base",
        width: 100, verticalAlign: "center", widgetsGap: 10,
        bgType: "color", backgroundColor: "transparent", bgImage: "", bgPosition: "center-center", bgAttachment: "default", bgRepeat: "no-repeat", bgSize: "cover", overlayColor: "transparent", overlayOpacity: 0,
        borderStyle: "none", borderWidth: 0, borderRadius: 0,
        marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0, paddingTop: 12, paddingRight: 12, paddingBottom: 12, paddingLeft: 12,
        zIndex: 1, cssId: "", cssClasses: "", animationType: "none", deviceVisibility: "all",
        widgets: [
          { widgetId: "wid_header_title", type: "header", text: "ASMITA OPERATIONS ACCOUNTS STATEMENT", textAlign: "center", fontSize: 18, textColor: "#ffffff", htmlTag: "h2", bold: true }
        ]
      }
    ]
  },
  {
    sectionId: "sec_global_standard",
    type: "layout_container",
    contentWidth: "boxed", columnsGap: "default", heightType: "auto", minHeight: 100, verticalAlign: "stretch", columnPosition: "middle", overflow: "visible", stretchSection: "no", htmlTag: "div",
    bgType: "color", backgroundColor: "#ffffff", bgImage: "", bgPosition: "center-center", bgAttachment: "default", bgRepeat: "no-repeat", bgSize: "cover", overlayColor: "transparent", overlayOpacity: 0,
    borderStyle: "none", borderWidth: 0, borderRadius: 0, textColor: "#334155", headingColor: "#27347B",
    marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0, paddingTop: 20, paddingRight: 20, paddingBottom: 20, paddingLeft: 20,
    zIndex: 1, cssId: "", cssClasses: "", animationType: "none", deviceVisibility: "all",
    columns: [
      {
        columnId: "col_standard_base",
        width: 100, verticalAlign: "stretch", widgetsGap: 15,
        bgType: "color", backgroundColor: "transparent", bgImage: "", bgPosition: "center-center", bgAttachment: "default", bgRepeat: "no-repeat", bgSize: "cover", overlayColor: "transparent", overlayOpacity: 0,
        borderStyle: "none", borderWidth: 0, borderRadius: 0,
        marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0, paddingTop: 12, paddingRight: 12, paddingBottom: 12, paddingLeft: 12,
        zIndex: 1, cssId: "", cssClasses: "", animationType: "none", deviceVisibility: "all",
        widgets: [
          { widgetId: "wid_pricing_table", type: "pricing_table_pro" }
        ]
      }
    ]
  },
  {
    sectionId: "sec_global_footer",
    type: "layout_container",
    contentWidth: "boxed", columnsGap: "default", heightType: "auto", minHeight: 40, verticalAlign: "center", columnPosition: "middle", overflow: "visible", stretchSection: "no", htmlTag: "div",
    bgType: "color", backgroundColor: "#f8fafc", bgImage: "", bgPosition: "center-center", bgAttachment: "default", bgRepeat: "no-repeat", bgSize: "cover", overlayColor: "transparent", overlayOpacity: 0,
    borderStyle: "none", borderWidth: 0, borderRadius: 0, textColor: "#64748b", headingColor: "#475569",
    marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0, paddingTop: 16, paddingRight: 16, paddingBottom: 16, paddingLeft: 16,
    zIndex: 1, cssId: "", cssClasses: "", animationType: "none", deviceVisibility: "all",
    columns: [
      {
        columnId: "col_footer_base",
        width: 100, verticalAlign: "center", widgetsGap: 10,
        bgType: "color", backgroundColor: "transparent", bgImage: "", bgPosition: "center-center", bgAttachment: "default", bgRepeat: "no-repeat", bgSize: "cover", overlayColor: "transparent", overlayOpacity: 0,
        borderStyle: "none", borderWidth: 0, borderRadius: 0,
        marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0, paddingTop: 12, paddingRight: 12, paddingBottom: 12, paddingLeft: 12,
        zIndex: 1, cssId: "", cssClasses: "", animationType: "none", deviceVisibility: "all",
        widgets: [
          { widgetId: "wid_subtitle_base", type: "subtitle", text: "Generated securely via AsmitA Core ERP Infrastructure Stack.", textAlign: "center", fontSize: 11, textColor: "#64748b" }
        ]
      }
    ]
  }
];

const SpacingControl = ({ label, data, prefix, updaterFn }) => {
  const [locked, setLocked] = useState(false);
  
  const handleUpdate = (side, val) => {
    const numVal = Number(val) || 0;
    if (locked) {
      updaterFn({
        [`${prefix}Top`]: numVal, [`${prefix}Right`]: numVal,
        [`${prefix}Bottom`]: numVal, [`${prefix}Left`]: numVal
      });
    } else {
      updaterFn({ [`${prefix}${side}`]: numVal });
    }
  };

  return (
    <div className={styles.inspectorSectionGroup}>
      <div className={styles.spacingControlHeader}>
        <label className={styles.controlMetaLabel}>{label}</label>
        <button 
          type="button" 
          className={locked ? styles.lockIconButtonActive : styles.lockIconButton} 
          onClick={() => setLocked(!locked)}
          title={locked ? "Unlock dimensions" : "Lock metrics symmetrically"}
        >
          {locked ? <FiLock size={12} /> : <FiUnlock size={12} />}
        </button>
      </div>
      <div className={styles.quadInputGrid}>
        <div className={styles.quadInputWrapper}>
           <input type="number" value={data?.[`${prefix}Top`] ?? 0} onChange={e => handleUpdate("Top", e.target.value)} />
           <span className={styles.quadInputSubLabel}>Top</span>
        </div>
        <div className={styles.quadInputWrapper}>
           <input type="number" value={data?.[`${prefix}Right`] ?? 0} onChange={e => handleUpdate("Right", e.target.value)} />
           <span className={styles.quadInputSubLabel}>Right</span>
        </div>
        <div className={styles.quadInputWrapper}>
           <input type="number" value={data?.[`${prefix}Bottom`] ?? 0} onChange={e => handleUpdate("Bottom", e.target.value)} />
           <span className={styles.quadInputSubLabel}>Bot</span>
        </div>
        <div className={styles.quadInputWrapper}>
           <input type="number" value={data?.[`${prefix}Left`] ?? 0} onChange={e => handleUpdate("Left", e.target.value)} />
           <span className={styles.quadInputSubLabel}>Left</span>
        </div>
      </div>
    </div>
  );
};

function parseTemplateVariables(rawString, invoiceContext = null) {
  if (!rawString) return "";
  const ctx = invoiceContext || { id: "INV-DEMO-99", customer: "Alpha Society Test Corp", email: "finance@alphacorp.in" };
  return DOMPurify.sanitize(rawString.replace(/{{invoice\.id}}/g, ctx.id).replace(/{{customer\.name}}/g, ctx.customer));
}

const UncontrolledRichTextEditor = ({ initialValue, onSaveChange }) => {
  const innerEditorRef = useRef(null);
  const execFormatting = (cmd) => {
    if (typeof window === "undefined") return;
    document.execCommand(cmd, false, null);
    if (innerEditorRef.current) onSaveChange(DOMPurify.sanitize(innerEditorRef.current.innerHTML));
  };

  return (
    <div className={styles.inspectorSectionGroup}>
      <div className={styles.wysiwygToolbarActionButtonsStripRow}>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormatting("bold"); }}><FiBold /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormatting("italic"); }}><FiItalic /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormatting("underline"); }}><FiUnderline /></button>
      </div>
      <div 
        ref={innerEditorRef}
        className={styles.wysiwygContentEditableContainerBodyArea} 
        contentEditable 
        suppressContentEditableWarning 
        onBlur={() => { if (innerEditorRef.current) onSaveChange(DOMPurify.sanitize(innerEditorRef.current.innerHTML)); }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(initialValue ?? "") }} 
      />
    </div>
  );
};

export default function TemplateEditorWorkspace() {
  const router = useRouter();
  const stageViewportRef = useRef(null);
  
  const [tmplName, setTmplName] = useState("Enterprise Accounting Scheme");
  const [tmplProduct, setTmplProduct] = useState("none");
  const [tmplFormat, setTmplFormat] = useState("a4");
  const [tmplOrientation, setTmplOrientation] = useState("portrait");
  const [tmplSections, setTmplSections] = useState(INITIAL_DEFAULT_LAYOUT);
  const [zoomLevel, setZoomLevel] = useState(0.8);
  
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState(null);
  
  const [autoSaveBadge, setAutoSaveBadge] = useState("All changes saved");
  const [variableSearch, setVariableSearch] = useState("");
  const [inspectorTab, setInspectorTab] = useState("content");
  const [styleMode, setStyleMode] = useState("normal");
  const [isDragging, setIsDragging] = useState(false);

  const isPanningRef = useRef(false);
  const startXRef = useRef(0); const startYRef = useRef(0);
  const scrollLeftRef = useRef(0); const scrollTopRef = useRef(0);

  const currentContext = {
    id: "INV-DEMO-99", customer: "Alpha Society Test Corp", email: "finance@alphacorp.in", 
    productId: tmplProduct !== "none" ? tmplProduct : "prod_crm_ent", qty: 1, 
    rate: tmplProduct === "prod_iot_node" ? 15000 : 45000, total: tmplProduct === "prod_iot_node" ? 17700 : 53100, 
    date: new Date().toISOString().split("T")[0] 
  };

  const filteredVariables = VARIABLE_DICTIONARY.filter(v => 
    v.token.toLowerCase().includes(variableSearch.toLowerCase()) || 
    v.description.toLowerCase().includes(variableSearch.toLowerCase())
  );

  const enforceHeaderFooterBoundaries = (list) => {
    const head = list.find(s => s.sectionId === "sec_global_header") || INITIAL_DEFAULT_LAYOUT[0];
    const foot = list.find(s => s.sectionId === "sec_global_footer") || INITIAL_DEFAULT_LAYOUT[2];
    const middles = list.filter(s => s.sectionId !== "sec_global_header" && s.sectionId !== "sec_global_footer");
    return [head, ...middles, foot];
  };

  const handleMouseDown = (e) => {
    if (
      e.target.closest("button") || e.target.closest("input") || 
      e.target.closest("select") || e.target.closest("[contenteditable]") ||
      e.target.closest("[draggable]") || e.target.closest("." + styles.topLeftQuickActionFloatingBar)
    ) return;
    if (e.button !== 0) return; 
    
    isPanningRef.current = true;
    startXRef.current = e.pageX - stageViewportRef.current.offsetLeft;
    startYRef.current = e.pageY - stageViewportRef.current.offsetTop;
    scrollLeftRef.current = stageViewportRef.current.scrollLeft;
    scrollTopRef.current = stageViewportRef.current.scrollTop;
    stageViewportRef.current.style.cursor = "grabbing";
  };

  const handleMouseMove = (e) => {
    if (!isPanningRef.current) return;
    e.preventDefault();
    const x = e.pageX - stageViewportRef.current.offsetLeft;
    const y = e.pageY - stageViewportRef.current.offsetTop;
    stageViewportRef.current.scrollLeft = scrollLeftRef.current - (x - startXRef.current) * 1.5;
    stageViewportRef.current.scrollTop = scrollTopRef.current - (y - startYRef.current) * 1.5;
  };

  const handleMouseUpOrLeave = () => {
    isPanningRef.current = false;
    if (stageViewportRef.current) stageViewportRef.current.style.cursor = "grab";
  };

  const updateNestedColumns = (columns, targetColumnId, actionFn) => {
    return columns.map(col => {
      if (col.columnId === targetColumnId) return actionFn(col);
      return col;
    });
  };

  const handleAddSectionRow = () => {
    const newSection = {
      sectionId: generateId("sec"),
      type: "layout_container",
      contentWidth: "boxed", columnsGap: "default", heightType: "auto", minHeight: 100, verticalAlign: "stretch", columnPosition: "middle", overflow: "visible", stretchSection: "no", htmlTag: "div",
      bgType: "color", backgroundColor: "#ffffff", bgImage: "", bgPosition: "center-center", bgAttachment: "default", bgRepeat: "no-repeat", bgSize: "cover", overlayColor: "transparent", overlayOpacity: 0,
      borderStyle: "none", borderWidth: 0, borderRadius: 0, textColor: "#334155", headingColor: "#27347B",
      paddingTop: 16, paddingRight: 16, paddingBottom: 16, paddingLeft: 16,
      marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0,
      zIndex: 1, cssId: "", cssClasses: "", animationType: "none", deviceVisibility: "all",
      columns: [{ columnId: generateId("col"), width: 100, verticalAlign: "stretch", widgetsGap: 10, backgroundColor: "transparent", bgImage: "", overlayColor: "transparent", borderStyle: "none", borderWidth: 0, borderRadius: 0, paddingTop: 12, paddingRight: 12, paddingBottom: 12, paddingLeft: 12, marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0, zIndex: 1, cssId: "", cssClasses: "", animationType: "none", deviceVisibility: "all", widgets: [] }]
    };
    const footerIdx = tmplSections.findIndex(s => s.sectionId === "sec_global_footer");
    const updated = [...tmplSections];
    if (footerIdx !== -1) updated.splice(footerIdx, 0, newSection);
    else updated.push(newSection);
    setTmplSections(enforceHeaderFooterBoundaries(updated));
  };

  const handleDuplicateSection = (secId) => {
    const targetIdx = tmplSections.findIndex(s => s.sectionId === secId);
    if (targetIdx === -1) return;
    const target = tmplSections[targetIdx];
    const clonedSection = {
      ...target,
      sectionId: generateId("sec"),
      columns: target.columns.map(col => ({
        ...col, columnId: generateId("col"),
        widgets: col.widgets.map(w => ({ ...w, widgetId: generateId("wid") }))
      }))
    };
    const updated = [...tmplSections];
    if (secId === "sec_global_header") updated.splice(1, 0, clonedSection);
    else if (secId === "sec_global_footer") updated.splice(targetIdx, 0, clonedSection);
    else updated.splice(targetIdx + 1, 0, clonedSection);
    setTmplSections(enforceHeaderFooterBoundaries(updated));
  };

  const handlePurgeSection = (secId) => {
    if (secId === "sec_global_header" || secId === "sec_global_footer") {
      setTmplSections(prev => prev.map(s => s.sectionId === secId ? { ...s, columns: [{ columnId: generateId("col"), width: 100, heightType: "auto", paddingTop: 12, paddingRight: 12, paddingBottom: 12, paddingLeft: 12, widgets: [] }] } : s));
    } else {
      setTmplSections(enforceHeaderFooterBoundaries(tmplSections.filter(s => s.sectionId !== secId)));
    }
    setSelectedSectionId(null); setSelectedColumnId(null); setSelectedWidgetId(null);
  };

  const handleAddColumnToSectionWidget = (targetSectionId) => {
    setTmplSections(prev => prev.map(sec => {
      if (sec.sectionId !== targetSectionId) return sec;
      const currentCols = sec.columns || [];
      const nextCount = currentCols.length + 1;
      if (nextCount > 4) return sec;
      const equalW = Math.floor(100 / nextCount);
      const newCol = { columnId: generateId("col"), width: equalW, heightType: "auto", fixedHeight: 150, verticalAlign: "stretch", widgetsGap: 10, backgroundColor: "transparent", bgImage: "", overlayColor: "transparent", borderStyle: "none", borderWidth: 0, borderRadius: 0, paddingTop: 12, paddingRight: 12, paddingBottom: 12, paddingLeft: 12, marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0, zIndex: 1, cssId: "", cssClasses: "", animationType: "none", deviceVisibility: "all", widgets: [] };
      return { ...sec, columns: [...currentCols, newCol].map(c => ({ ...c, width: equalW })) };
    }));
  };

  const handleDuplicateColumnNode = (secId, colId) => {
    setTmplSections(prev => prev.map(sec => {
      if (sec.sectionId !== secId) return sec;
      const idx = sec.columns.findIndex(c => c.columnId === colId);
      if (idx === -1 || sec.columns.length >= 4) return sec;
      const clonedCol = { ...sec.columns[idx], columnId: generateId("col"), widgets: sec.columns[idx].widgets.map(w => ({ ...w, widgetId: generateId("wid") })) };
      const nextCols = [...sec.columns]; nextCols.splice(idx + 1, 0, clonedCol);
      const equalW = Math.floor(100 / nextCols.length);
      return { ...sec, columns: nextCols.map(c => ({ ...c, width: equalW })) };
    }));
  };

  const handleRemoveColumnNode = (secId, colId) => {
    setTmplSections(prev => prev.map(sec => {
      if (sec.sectionId !== secId) return sec;
      const filtered = sec.columns.filter(c => c.columnId !== colId);
      if (filtered.length === 0) return sec;
      const equalW = Math.floor(100 / filtered.length);
      return { ...sec, columns: filtered.map(c => ({ ...c, width: equalW })) };
    }));
    if (selectedColumnId === colId) { setSelectedColumnId(null); setSelectedWidgetId(null); }
  };

  const handleAddWidgetToColumn = (sectionId, columnId, widgetType) => {
    const registryEntry = ELEMENT_REGISTRY[widgetType];
    if (!registryEntry) return;
    const newWidget = { widgetId: generateId("wid"), type: widgetType, ...registryEntry.config.baselineConfig };
    setTmplSections(prev => prev.map(sec => {
      if (sec.sectionId !== sectionId) return sec;
      return { ...sec, columns: updateNestedColumns(sec.columns, columnId, (col) => ({ ...col, widgets: [...(col.widgets || []), newWidget] })) };
    }));
    setSelectedWidgetId(newWidget.widgetId);
  };

  const handleDuplicateWidget = (secId, colId, widgetId) => {
    setTmplSections(prev => prev.map(sec => {
      if (sec.sectionId !== secId) return sec;
      return {
        ...sec,
        columns: sec.columns.map(col => {
          if (col.columnId !== colId) return col;
          const idx = col.widgets.findIndex(w => w.widgetId === widgetId);
          if (idx === -1) return col;
          const cloned = { ...col.widgets[idx], widgetId: generateId("wid") };
          const nextW = [...col.widgets]; nextW.splice(idx + 1, 0, cloned);
          return { ...col, widgets: nextW };
        })
      };
    }));
  };

  const handleUpdateSectionOrColumnDirectly = (targetId, key, value) => {
    setTmplSections(prev => prev.map(sec => {
      if (sec.sectionId === targetId) return { ...sec, [key]: value };
      return {
        ...sec,
        columns: sec.columns.map(col => col.columnId === targetId ? { ...col, [key]: value } : col)
      };
    }));
  };

  const handleUpdateLayoutPaddingsAndMargins = (targetId, metricsObj) => {
    setTmplSections(prev => prev.map(sec => {
      if (sec.sectionId === targetId) return { ...sec, ...metricsObj };
      return {
        ...sec,
        columns: sec.columns.map(col => {
          if (col.columnId === targetId) return { ...col, ...metricsObj };
          return {
            ...col,
            widgets: col.widgets.map(w => w.widgetId === targetId ? { ...w, ...metricsObj } : w)
          };
        })
      };
    }));
  };

  const handleRemoveWidget = (widgetId) => {
    setTmplSections(prev => prev.map(sec => ({
      ...sec, columns: sec.columns.map(col => ({ ...col, widgets: col.widgets.filter(w => w.widgetId !== widgetId) }))
    })));
    if (selectedWidgetId === widgetId) setSelectedWidgetId(null);
  };

  const handleUpdateRepeater = (targetId, fieldId, index, key, value) => {
    setTmplSections(prev => prev.map(sec => {
      if (sec.sectionId === targetId) {
        const arr = [...(sec[fieldId] || [])]; arr[index] = { ...arr[index], [key]: value };
        return { ...sec, [fieldId]: arr };
      }
      return {
        ...sec,
        columns: sec.columns.map(col => {
          if (col.columnId === targetId) {
            const arr = [...(col[fieldId] || [])]; arr[index] = { ...arr[index], [key]: value };
            return { ...col, [fieldId]: arr };
          }
          return {
            ...col,
            widgets: col.widgets.map(w => {
              if (w.widgetId !== targetId) return w;
              const arr = [...(w[fieldId] || [])]; arr[index] = { ...arr[index], [key]: value };
              return { ...w, [fieldId]: arr };
            })
          };
        })
      };
    }));
  };

  const handleAddRepeaterRow = (targetId, fieldId, defaultObj = {}) => {
    setTmplSections(prev => prev.map(sec => {
      if (sec.sectionId === targetId) return { ...sec, [fieldId]: [...(sec[fieldId] || []), defaultObj] };
      return {
        ...sec,
        columns: sec.columns.map(col => {
          if (col.columnId === targetId) return { ...col, [fieldId]: [...(col[fieldId] || []), defaultObj] };
          return {
            ...col,
            widgets: col.widgets.map(w => w.widgetId === targetId ? { ...w, [fieldId]: [...(w[fieldId] || []), defaultObj] } : w)
          };
        })
      };
    }));
  };

  const handleRemoveRepeaterRow = (targetId, fieldId, index) => {
    setTmplSections(prev => prev.map(sec => {
      if (sec.sectionId === targetId) return { ...sec, [fieldId]: (sec[fieldId] || []).filter((_, i) => i !== index) };
      return {
        ...sec,
        columns: sec.columns.map(col => {
          if (col.columnId === targetId) return { ...col, [fieldId]: (col[fieldId] || []).filter((_, i) => i !== index) };
          return {
            ...col,
            widgets: col.widgets.map(w => w.widgetId === targetId ? { ...w, [fieldId]: (w[fieldId] || []).filter((_, i) => i !== index) } : w)
          };
        })
      };
    }));
  };

  const renderControlField = (field, targetNode) => {
    const targetId = targetNode.widgetId || targetNode.columnId || targetNode.sectionId;
    
    if (field.type === "slider") {
      return (
        <div key={field.id} className={styles.controlGroupBlock}>
          <label className={styles.controlMetaLabel}>{field.label}</label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input 
              type="range" min={field.min || 0} max={field.max || 1000} step={field.step || 1}
              value={targetNode[field.id] ?? 0}
              style={{ flex: 1, accentColor: "#27347B" }}
              onChange={(e) => handleUpdateSectionOrColumnDirectly(targetId, field.id, Number(e.target.value))}
            />
            <input 
              type="number" className={styles.builderTextInputField} style={{ width: "65px", height: "32px", textAlign: "center" }}
              value={targetNode[field.id] ?? 0}
              onChange={(e) => handleUpdateSectionOrColumnDirectly(targetId, field.id, Number(e.target.value))}
            />
          </div>
        </div>
      );
    }

    if (field.type === "repeater") {
      const isColumnMatrix = field.id === "columns";
      return (
        <div key={field.id} className={styles.inspectorSectionGroup}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label className={styles.controlMetaLabel}>{field.label}</label>
            <button 
              type="button" className={styles.addRepeaterBtn} 
              onClick={() => handleAddRepeaterRow(targetId, field.id, field.fields.reduce((acc, f) => ({ ...acc, [f.id]: f.type === "number" ? 0 : (f.id === "heightType" ? "auto" : "") }), {}))}
            >
              <FiPlus size={12} style={{ marginRight: "4px" }} /> Add Entry
            </button>
          </div>
          
          <div className={styles.repeaterContainerStack}>
            {(targetNode[field.id] || []).map((item, idx) => (
              <div key={idx} className={isColumnMatrix ? styles.columnMatrixCard : styles.repeaterRow}>
                {isColumnMatrix ? (
                  <div className={styles.columnMatrixBodyForm}>
                    <div className={styles.columnMatrixHeaderRow}>
                      <span className={styles.columnCardIndexBadge}>Column #{idx + 1}</span>
                    </div>
                    <div className={styles.matrixFieldsLayoutGrid}>
                      <div className={styles.subFieldBlockItem}>
                        <span className={styles.matrixInputLabel}>Width (%)</span>
                        <input 
                          type="number" placeholder="Width %" className={styles.builderTextInputField}
                          value={item.width ?? ""}
                          onChange={(e) => handleUpdateRepeater(targetId, field.id, idx, "width", Number(e.target.value))}
                        />
                      </div>
                      <div className={styles.subFieldBlockItem}>
                        <span className={styles.matrixInputLabel}>Height Type</span>
                        <select 
                          className={styles.builderSelectField} value={item.heightType || "auto"}
                          onChange={(e) => handleUpdateRepeater(targetId, field.id, idx, "heightType", e.target.value)}
                        >
                          <option value="auto">Auto Fit</option>
                          <option value="fixed">Fixed Height</option>
                        </select>
                      </div>
                    </div>
                    {item.heightType === "fixed" && (
                      <div className={styles.controlGroupBlock} style={{ marginTop: "8px" }}>
                        <span className={styles.matrixInputLabel}>Height (px)</span>
                        <input 
                          type="number" placeholder="Height px" className={styles.builderTextInputField}
                          value={item.fixedHeight ?? ""}
                          onChange={(e) => handleUpdateRepeater(targetId, field.id, idx, "fixedHeight", Number(e.target.value))}
                        />
                      </div>
                    )}
                    <button 
                      type="button" className={styles.matrixCardPurgeBtn} 
                      onClick={() => handleRemoveRepeaterRow(targetId, field.id, idx)}
                    >
                      <FiTrash2 size={12} style={{ marginRight: "4px" }} /> Delete Column
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={styles.standardFieldsLayoutGrid}>
                      {field.fields.map(subField => (
                        <div key={subField.id} className={styles.subFieldBlockItem}>
                          {subField.type === "select" ? (
                            <select 
                              className={styles.builderSelectField} value={item[subField.id] || ""}
                              onChange={(e) => handleUpdateRepeater(targetId, field.id, idx, subField.id, e.target.value)}
                            >
                              {(subField.options || []).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          ) : (
                            <input 
                              type={subField.type || "text"} placeholder={subField.label || subField.id} className={styles.builderTextInputField}
                              value={item[subField.id] ?? ""}
                              onChange={(e) => handleUpdateRepeater(targetId, field.id, idx, subField.id, subField.type === "number" ? Number(e.target.value) : e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <button 
                      type="button" className={styles.actionBtnMiniPurge} 
                      style={{ position: "absolute", right: "4px", top: "50%", transform: "translateY(-50%)", width: "24px", height: "24px" }}
                      onClick={() => handleRemoveRepeaterRow(targetId, field.id, idx)}
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    switch (field.type) {
      case "text":
      case "number":
        return (
          <div key={field.id} className={styles.controlGroupBlock}>
            <label className={styles.controlMetaLabel}>{field.label}</label>
            <input 
              type={field.type} className={styles.builderTextInputField} value={targetNode[field.id] ?? ""} 
              onChange={(e) => handleUpdateSectionOrColumnDirectly(targetId, field.id, field.type === "number" ? Number(e.target.value) : e.target.value)} 
            />
          </div>
        );
      case "select":
        return (
          <div key={field.id} className={styles.controlGroupBlock}>
            <label className={styles.controlMetaLabel}>{field.label}</label>
            <select 
              className={styles.builderSelectField} value={targetNode[field.id] || ""} 
              onChange={(e) => handleUpdateSectionOrColumnDirectly(targetId, field.id, e.target.value)}
            >
              {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        );
      case "color":
        return (
          <div key={field.id} className={styles.controlGroupBlock}>
            <label className={styles.controlMetaLabel}>{field.label}</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input 
                type="color" className={styles.colorInputElementNode} value={targetNode[field.id] ?? "#000000"} 
                onChange={(e) => handleUpdateSectionOrColumnDirectly(targetId, field.id, e.target.value)} 
              />
              <input 
                type="text" className={styles.builderTextInputField} style={{ height: "34px", fontSize: "11px", fontFamily: "monospace" }}
                value={targetNode[field.id] ?? "#000000"} maxLength={7}
                onChange={(e) => handleUpdateSectionOrColumnDirectly(targetId, field.id, e.target.value)} 
              />
            </div>
          </div>
        );
      case "alignment_picker":
        return (
          <div key={field.id} className={styles.controlGroupBlock}>
            <label className={styles.controlMetaLabel}>{field.label}</label>
            <div className={styles.alignmentToolbarStrip}>
              {["left", "center", "right"].map(pos => (
                <button key={pos} type="button" className={targetNode[field.id] === pos ? styles.activeAlignBtn : ""} onClick={() => handleUpdateSectionOrColumnDirectly(targetId, field.id, pos)}>
                  {pos === "left" && <FiAlignLeft />}
                  {pos === "center" && <FiAlignCenter />}
                  {pos === "right" && <FiAlignRight />}
                </button>
              ))}
            </div>
          </div>
        );
      case "wysiwyg":
        return <UncontrolledRichTextEditor key={targetId} initialValue={targetNode[field.id]} onSaveChange={(val) => handleUpdateSectionOrColumnDirectly(targetId, field.id, val)} />;
      default:
        return null;
    }
  };

  const renderAdvancedInspector = (styleData, updaterFn) => {
    return (
      <div className={styles.inspectorTabBody}>
        <SpacingControl label="External Layout Margins (px)" data={styleData || {}} prefix="margin" updaterFn={updaterFn} />
        <SpacingControl label="Internal Padding Constraints (px)" data={styleData || {}} prefix="padding" updaterFn={updaterFn} />
        
        <div className={styles.controlGroupBlock}>
          <label className={styles.controlMetaLabel}>Border Style</label>
          <select className={styles.builderSelectField} value={styleData?.borderStyle || "none"} onChange={e => updaterFn("borderStyle", e.target.value)}>
            <option value="none">None</option>
            <option value="solid">Solid Line</option>
            <option value="dashed">Dashed Border</option>
          </select>
        </div>

        {styleData?.borderStyle && styleData.borderStyle !== "none" && (
          <div className={styles.formRowTwoColumnGrid}>
            <div className={styles.controlGroupBlock}>
              <label className={styles.controlMetaLabel}>Thickness (px)</label>
              <input type="number" className={styles.builderTextInputField} value={styleData?.borderWidth || 0} onChange={e => updaterFn("borderWidth", Number(e.target.value))} />
            </div>
            <div className={styles.controlGroupBlock}>
              <label className={styles.controlMetaLabel}>Color</label>
              <input type="color" className={styles.colorInputElementNode} value={styleData?.borderColor || "#cbd5e1"} onChange={e => updaterFn("borderColor", e.target.value)} />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLeafWidgetNode = (wid, secId, colId) => {
    const isWSelected = selectedWidgetId === wid.widgetId;
    const Entry = ELEMENT_REGISTRY[wid.type];
    const Component = Entry?.component;

    return (
      <div 
        key={wid.widgetId}
        className={`${styles.canvasWidgetRenderLeafNode} ${isWSelected ? styles.widgetLeafActiveSelected : ""}`}
        onClick={(e) => { e.stopPropagation(); setSelectedSectionId(secId); setSelectedColumnId(colId); setSelectedWidgetId(wid.widgetId); setInspectorTab("content"); }}
      >
        <div className={styles.topLeftQuickActionFloatingBar}>
          <button type="button" className={styles.actionPillBtnSelect} title="Select Element"><FiMousePointer size={10} /></button>
          <button type="button" className={styles.actionPillBtnDuplicate} title="Duplicate Element" onClick={(e) => { e.stopPropagation(); handleDuplicateWidget(secId, colId, wid.widgetId); }}><FiCopy size={10} /></button>
          <button type="button" className={styles.actionPillBtnPurge} title="Remove Element" onClick={(e) => { e.stopPropagation(); handleRemoveWidget(wid.widgetId); }}><FiTrash2 size={10} /></button>
        </div>

        {Component && <Component widget={wid} context={currentContext} parseFn={parseTemplateVariables} />}
      </div>
    );
  };

  const activeWidget = tmplSections.flatMap(s => s.columns.flatMap(c => c.widgets)).find(w => w.widgetId === selectedWidgetId);
  const activeColumnNode = selectedColumnId ? tmplSections.flatMap(s => s.columns).find(c => c.columnId === selectedColumnId) : null;
  const activeSectionNode = selectedSectionId ? tmplSections.find(s => s.sectionId === selectedSectionId) : null;

  const activeTargetNode = activeWidget ? activeWidget : (activeColumnNode ? activeColumnNode : activeSectionNode);
  const nodeContextType = activeWidget ? "widget" : (activeColumnNode ? "column" : "section");

  const layoutContainerFields = {
    section: {
      content: [
        { id: "contentWidth", type: "select", label: "Content Width", options: [{ value: "boxed", label: "Boxed" }, { value: "full", label: "Full Width" }] },
        { id: "columnsGap", type: "select", label: "Columns Gap", options: [{ value: "default", label: "Default" }, { value: "no-gap", label: "No Gap" }, { value: "narrow", label: "Narrow" }, { value: "wide", label: "Wide" }] },
        { id: "heightType", type: "select", label: "Height", options: [{ value: "auto", label: "Default" }, { value: "fixed", label: "Min Height" }] },
        { id: "minHeight", type: "slider", label: "Minimum Height (px)", min: 0, max: 1000, step: 10 },
        { id: "columnPosition", type: "select", label: "Column Position", options: [{ value: "top", label: "Top" }, { value: "middle", label: "Middle" }, { value: "bottom", label: "Bottom" }, { value: "stretch", label: "Stretch" }] },
        { id: "verticalAlign", type: "select", label: "Vertical Align", options: [{ value: "stretch", label: "Default" }, { value: "flex-start", label: "Top" }, { value: "center", label: "Middle" }, { value: "flex-end", label: "Bottom" }] },
        { id: "overflow", type: "select", label: "Overflow", options: [{ value: "visible", label: "Default" }, { value: "hidden", label: "Hidden" }] },
        { id: "stretchSection", type: "select", label: "Stretch Section", options: [{ value: "no", label: "No" }, { value: "yes", label: "Yes" }] },
        { id: "htmlTag", type: "select", label: "HTML Tag", options: [{ value: "div", label: "Default (div)" }, { value: "header", label: "header" }, { value: "footer", label: "footer" }, { value: "section", label: "section" }] },
        { id: "columns", type: "repeater", label: "Column Layout Schema Matrix", fields: [{ id: "width", type: "number", label: "Width %" }] }
      ],
      style: [
        { id: "bgType", type: "select", label: "Background Type", options: [{ value: "color", label: "Classic" }, { value: "gradient", label: "Gradient" }] },
        { id: "backgroundColor", type: "color", label: "Color" },
        { id: "bgImage", type: "text", label: "Image Reference URL" },
        { id: "bgPosition", type: "select", label: "Position", options: [{ value: "center-center", label: "Center Center" }, { value: "top-center", label: "Top Center" }, { value: "bottom-center", label: "Bottom Center" }] },
        { id: "bgAttachment", type: "select", label: "Attachment", options: [{ value: "default", label: "Default" }, { value: "scroll", label: "Scroll" }, { value: "fixed", label: "Fixed" }] },
        { id: "bgRepeat", type: "select", label: "Repeat", options: [{ value: "no-repeat", label: "No-repeat" }, { value: "repeat", label: "Repeat" }] },
        { id: "bgSize", type: "select", label: "Display Size", options: [{ value: "cover", label: "Cover" }, { value: "contain", label: "Contain" }, { value: "auto", label: "Auto" }] },
        { id: "overlayColor", type: "color", label: "Overlay Color" },
        { id: "overlayOpacity", type: "slider", label: "Overlay Opacity", min: 0, max: 100, step: 5 },
        { id: "borderStyle", type: "select", label: "Border Style", options: [{ value: "none", label: "None" }, { value: "solid", label: "Solid" }, { value: "dashed", label: "Dashed" }] },
        { id: "borderWidth", type: "slider", label: "Border Width (px)", min: 0, max: 20 },
        { id: "borderRadius", type: "slider", label: "Border Radius (px)", min: 0, max: 100 },
        { id: "textColor", type: "color", label: "Text Color" },
        { id: "headingColor", type: "color", label: "Heading Color" }
      ]
    },
    column: {
      content: [
        { id: "verticalAlign", type: "select", label: "Vertical Alignment", options: [{ value: "stretch", label: "Default" }, { value: "flex-start", label: "Top" }, { value: "center", label: "Middle" }, { value: "flex-end", label: "Bottom" }] }
      ],
      style: [
        { id: "backgroundColor", type: "color", label: "Solid Background Color Fill Hex" },
        { id: "bgImage", type: "text", label: "Background Media URL Link" },
        { id: "overlayColor", type: "color", label: "Tint Overlay Screen Mask Color" },
        { id: "borderStyle", type: "select", label: "Border Frame Stroke Type", options: [{ value: "none", label: "None Default" }, { value: "solid", label: "Solid Line" }, { value: "dashed", label: "Dashed Line" }] },
        { id: "borderWidth", type: "slider", label: "Stroke Frame Width (px)", min: 0, max: 20 },
        { id: "borderRadius", type: "slider", label: "Corner Edge Frame Radius (px)", min: 0, max: 50 }
      ]
    }
  };

  const schemaSource = nodeContextType === "widget" 
    ? ELEMENT_REGISTRY[activeWidget.type]?.config.fields 
    : (nodeContextType === "column" ? layoutContainerFields.column : layoutContainerFields.section);

  return (
    <div className={styles.adminLayout}>
      <Sidebar activeId="invoices" />
      <main className={styles.mainCanvas}>
        <div className={styles.pageMaxWidth}>
          
          <header className={styles.pageHeader}>
            <div className={styles.headerLeftBlock}>
              <button className={styles.backButton} onClick={() => router.push("/invoices/templates")}><FiArrowLeft /></button>
              <div>
                <div className={styles.builderTitleFlexRow}>
                  <h1>PDF Section Blueprint Studio</h1>
                  <span className={styles.autoSaveStatusBadge}>{autoSaveBadge}</span>
                </div>
                <p>Configure advanced multi-column template rules with dynamic context-aware operational links.</p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.zoomButton} onClick={() => setZoomLevel(Math.max(0.3, zoomLevel - 0.05))}><FiZoomOut /></button>
              <span className={styles.zoomPct}>{Math.round(zoomLevel * 100)}%</span>
              <button className={styles.zoomButton} onClick={() => setZoomLevel(Math.min(2.0, zoomLevel + 0.05))}><FiZoomIn /></button>
              <AdminButton variant="primary" icon={FiCheck} onClick={() => router.push("/invoices/templates")}>Finish Layout</AdminButton>
            </div>
          </header>

          <div className={styles.studioWorkspaceSplitGrid}>
            <aside className={styles.leftComponentDeckPanel}>
              <div className={styles.panelSectionHeading}><FiGrid /> <span>Layout Toolbox</span></div>
              <div className={styles.toolboxAssetsGrid}>
                {AVAILABLE_ASSETS.map(asset => {
                  const Icon = asset.icon;
                  if (asset.type === "layout_container") return null;
                  return (
                    <button 
                      key={asset.type} className={styles.toolboxAssetCard}
                      onClick={() => selectedSectionId && selectedColumnId && handleAddWidgetToColumn(selectedSectionId, selectedColumnId, asset.type)}
                    >
                      <Icon className={styles.assetCardIcon} />
                      <span>{asset.label}</span>
                    </button>
                  );
                })}
              </div>
              <button className={styles.appendRowBtnStructure} onClick={handleAddSectionRow}><FiPlus /> Append Grid Section Row</button>

              <div className={styles.apiVariablesDictionaryReferenceGuideCardBlock}>
                <div className={styles.panelSectionHeading} style={{marginTop: "8px"}}><FiBriefcase /> <span>Kylas Context Tokens</span></div>
                <div className={styles.searchVariableInputContainer}>
                  <FiSearch className={styles.searchVariableInputIcon} />
                  <input type="text" placeholder="Filter variables..." value={variableSearch} onChange={e => setVariableSearch(e.target.value)} />
                </div>
                <div className={styles.dictionaryListItemsScrollingStack}>
                  {filteredVariables.map(v => (
                    <div key={v.token} className={styles.dictionaryRowCardItemLine} onClick={() => copyToClipboard(v.token)}>
                      <code className={styles.dictionaryTokenFieldCodeHighlight}>{v.token}</code>
                      <span>{v.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <section 
              className={styles.centerStageViewportArea} ref={stageViewportRef}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave} onMouseLeave={handleMouseUpOrLeave}
            >
              <div className={styles.canvasPreviewViewportFrameA4AestheticSheet}>
                <div 
                  className={styles.pdfInvoiceLayoutContainerMock} 
                  style={{ 
                    width: `${DOC_DIMENSIONS[tmplFormat][tmplOrientation].width}px`, 
                    minHeight: `${DOC_DIMENSIONS[tmplFormat][tmplOrientation].height}px`,
                    transform: `scale(${zoomLevel})`, transformOrigin: "top center"
                  }}
                  onClick={() => { setSelectedSectionId(null); setSelectedColumnId(null); setSelectedWidgetId(null); }}
                >
                  {tmplSections.map(sec => {
                    const isSecSelected = selectedSectionId === sec.sectionId && !selectedColumnId && !selectedWidgetId;
                    const RenderComponent = ELEMENT_REGISTRY["layout_container"]?.component;

                    return (
                      <div 
                        key={sec.sectionId}
                        className={`${styles.renderedCanvasSectionRow} ${isSecSelected ? styles.sectionRowActiveSelected : ""}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedSectionId(sec.sectionId); setSelectedColumnId(null); setSelectedWidgetId(null); setInspectorTab("content"); }}
                      >
                        <div className={styles.topLeftQuickActionFloatingBar}>
                          <button type="button" className={styles.actionPillBtnSelect}><FiMousePointer size={10} /></button>
                          <button type="button" className={styles.actionPillBtnDuplicate} onClick={(e) => { e.stopPropagation(); handleDuplicateSection(sec.sectionId); }}><FiCopy size={10} /></button>
                          <button type="button" className={styles.actionPillBtnPurge} onClick={(e) => { e.stopPropagation(); handlePurgeSection(sec.sectionId); }}><FiTrash2 size={10} /></button>
                        </div>

                        {RenderComponent && (
                          <RenderComponent 
                            widget={sec} context={currentContext} parseFn={parseTemplateVariables}
                            renderWidgetFn={(columnNode) => {
                              const isColSelected = selectedColumnId === columnNode.columnId && !selectedWidgetId;
                              return (
                                <div 
                                  key={columnNode.columnId}
                                  className={`${styles.renderedCanvasColumnNode} ${isColSelected ? styles.columnNodeActiveSelected : ""} studio-col-added-animate`}
                                  style={{ 
                                    flex: `0 0 ${columnNode.width}%`, 
                                    width: `${columnNode.width}%`, 
                                    minHeight: columnNode.heightType === "fixed" ? `${columnNode.fixedHeight || 100}px` : "auto",
                                    position: "relative"
                                  }}
                                  onClick={(e) => { e.stopPropagation(); setSelectedSectionId(sec.sectionId); setSelectedColumnId(columnNode.columnId); setSelectedWidgetId(null); setInspectorTab("content"); }}
                                  onDragOver={e => e.preventDefault()}
                                  onDrop={e => {
                                    e.preventDefault(); e.stopPropagation();
                                    const assetType = e.dataTransfer.getData("new_widget");
                                    if (assetType) handleAddWidgetToColumn(sec.sectionId, columnNode.columnId, assetType);
                                  }}
                                >
                                  {/* DE-COUPLED COLUMN OVERLAY SELECTION PILL ACTION BAR */}
                                  <div className={styles.topLeftQuickActionFloatingBar} style={{ transform: "translateY(-4px)" }}>
                                    <button type="button" className={styles.actionPillBtnSelect}><FiMousePointer size={10} /></button>
                                    <button type="button" className={styles.actionPillBtnDuplicate} onClick={(e) => { e.stopPropagation(); handleDuplicateColumnNode(sec.sectionId, columnNode.columnId); }}><FiCopy size={10} /></button>
                                    <button type="button" className={styles.actionPillBtnPurge} onClick={(e) => { e.stopPropagation(); handleRemoveColumnNode(sec.sectionId, columnNode.columnId); }}><FiTrash2 size={10} /></button>
                                  </div>

                                  <div 
                                    className={styles.columnWidgetsVerticalStackList}
                                    style={{
                                      paddingTop: `${columnNode.paddingTop ?? 0}px`,
                                      paddingRight: `${columnNode.paddingRight ?? 0}px`,
                                      paddingBottom: `${columnNode.paddingBottom ?? 0}px`,
                                      paddingLeft: `${columnNode.paddingLeft ?? 0}px`,
                                      width: "100%", height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box"
                                    }}
                                  >
                                    {columnNode.widgets?.map(wid => renderLeafWidgetNode(wid, sec.sectionId, columnNode.columnId))}
                                    {(!columnNode.widgets || columnNode.widgets.length === 0) && <div className={styles.emptyColumnDropzone}>Empty Target Column</div>}
                                  </div>
                                </div>
                              );
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <aside className={styles.rightPropertyInspectorPanel}>
              <div className={styles.editSectionTitleBannerHeading}>Edit {nodeContextType.toUpperCase()}</div>
              
              {activeTargetNode && (
                <div className={styles.inspectorFlowWrapper}>
                  <div className={styles.inspectorTabsStrip}>
                    <button className={inspectorTab === "content" ? styles.tabActive : ""} onClick={() => setInspectorTab("content")}>Layout</button>
                    <button className={inspectorTab === "style" ? styles.tabActive : ""} onClick={() => setInspectorTab("style")}>Style</button>
                    <button className={inspectorTab === "advanced" ? styles.tabActive : ""} onClick={() => setInspectorTab("advanced")}>Advanced</button>
                  </div>
                  
                  {inspectorTab === "content" && (
                    <div className={styles.inspectorFormList}>
                      {nodeContextType === "section" && (
                        <button type="button" className={styles.addRepeaterBtn} onClick={() => handleAddColumnToSectionWidget(activeSectionNode.sectionId)}>+ Add Column Node</button>
                      )}
                      
                      {nodeContextType === "column" && activeColumnNode && (
                        <div className={styles.controlGroupBlock}>
                          <label className={styles.controlMetaLabel}>Width Metric (%)</label>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <input 
                              type="range" min="10" max="100" step="5" value={activeColumnNode.width || 100}
                              style={{ flex: 1, accentColor: "#27347B" }}
                              onChange={(e) => handleUpdateSectionOrColumnDirectly(activeColumnNode.columnId, "width", Number(e.target.value))}
                            />
                            <span style={{ fontSize: "12px", fontWeight: "700", minWidth: "36px" }}>{activeColumnNode.width || 100}%</span>
                          </div>
                        </div>
                      )}

                      {schemaSource?.content?.map(field => renderControlField(field, activeTargetNode))}
                    </div>
                  )}

                  {inspectorTab === "style" && (
                    <div className={styles.inspectorFormList}>
                      {(nodeContextType === "section" || nodeContextType === "column") && (
                        <div className={styles.normalHoverButtonsToggleBarStrip}>
                          <button className={styleMode === "normal" ? styles.activeStyleModeBtn : ""} onClick={() => setStyleMode("normal")}>Normal</button>
                          <button className={styleMode === "hover" ? styles.activeStyleModeBtn : ""} onClick={() => setStyleMode("hover")}>Hover</button>
                        </div>
                      )}
                      {schemaSource?.style?.map(field => renderControlField(field, activeTargetNode))}
                    </div>
                  )}

                  {inspectorTab === "advanced" && (
                    <div className={styles.inspectorFormList}>
                      <SpacingControl label="Margin Dimensions" data={activeTargetNode} prefix="margin" updaterFn={(metrics) => handleUpdateLayoutPaddingsAndMargins(activeTargetNode.widgetId || activeTargetNode.columnId || activeTargetNode.sectionId, metrics)} />
                      <SpacingControl label="Padding Dimensions" data={activeTargetNode} prefix="padding" updaterFn={(metrics) => handleUpdateLayoutPaddingsAndMargins(activeTargetNode.widgetId || activeTargetNode.columnId || activeTargetNode.sectionId, metrics)} />
                      
                      <div className={styles.controlGroupBlock}>
                        <label className={styles.controlMetaLabel}>Device Filter Selector</label>
                        <select className={styles.builderSelectField} value={activeTargetNode.deviceVisibility || "all"} onChange={(e) => handleUpdateSectionOrColumnDirectly(activeTargetNode.widgetId || activeTargetNode.columnId || activeTargetNode.sectionId, "deviceVisibility", e.target.value)}>
                          <option value="all">Visible on All Devices</option>
                          <option value="mobile-only">Mobile Layout Screens Only</option>
                          <option value="desktop-only">Desktop Documents Only</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}