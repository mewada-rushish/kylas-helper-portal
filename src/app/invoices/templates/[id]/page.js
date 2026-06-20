// src/app/invoices/templates/[id]/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  FiPlus, FiTrash2, FiCheck, FiArrowLeft, FiPrinter, FiSearch, 
  FiMove, FiBold, FiItalic, FiUnderline, FiAlignLeft, FiAlignCenter, FiAlignRight,
  FiLock, FiUnlock
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
  letter: { portrait: { width: 816, height: 1056 }, landscape: { width: 1056, height: 816 } },
  legal: { portrait: { width: 816, height: 1344 }, landscape: { width: 1344, height: 816 } }
};

const DEFAULT_ADVANCED_STYLE = {
  marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0,
  paddingTop: 12, paddingRight: 12, paddingBottom: 12, paddingLeft: 12,
  borderType: "none", borderWidth: 0, borderColor: "#e2e8f0", borderRadius: 0, zIndex: 1
};

const INITIAL_DEFAULT_LAYOUT = [
  {
    sectionId: "sec_global_header",
    type: "header",
    style: { backgroundColor: "#27347B", backgroundImage: "", paddingTop: "20px", paddingBottom: "20px" },
    columns: [
      {
        columnId: generateId("col"),
        width: 100,
        advanced: { ...DEFAULT_ADVANCED_STYLE },
        widgets: [
          { widgetId: generateId("wid"), type: "header", text: "ASMITA OPERATIONS ACCOUNTS STATEMENT", textAlign: "center", fontSize: 20, textColor: "#ffffff", htmlTag: "h2", advanced: { ...DEFAULT_ADVANCED_STYLE } }
        ]
      }
    ]
  },
  {
    sectionId: generateId("sec"),
    type: "standard",
    style: { backgroundColor: "#ffffff", backgroundImage: "", paddingTop: "12px", paddingBottom: "12px" },
    columns: [
      {
        columnId: generateId("col"),
        width: 100,
        advanced: { ...DEFAULT_ADVANCED_STYLE },
        widgets: [
          { widgetId: generateId("wid"), type: "pricing_table", headerBg: "#f8fafc", headerText: "#475569", headerAlign: "left", contentAlign: "left", headerPadding: 12, contentPadding: 12, borderColor: "#e2e8f0", col1Name: "Product Name", col2Name: "Qty", col3Name: "Total Amount", advanced: { ...DEFAULT_ADVANCED_STYLE } }
        ]
      }
    ]
  },
  {
    sectionId: "sec_global_footer",
    type: "footer",
    style: { backgroundColor: "#f8fafc", backgroundImage: "", paddingTop: "16px", paddingBottom: "16px" },
    columns: [
      {
        columnId: generateId("col"),
        width: 100,
        advanced: { ...DEFAULT_ADVANCED_STYLE },
        widgets: [
          { widgetId: generateId("wid"), type: "subtitle", text: "Generated securely via AsmitA Core ERP Infrastructure Stack. All rights reserved.", textAlign: "center", fontSize: 11, textColor: "#64748b", htmlTag: "p", advanced: { ...DEFAULT_ADVANCED_STYLE } }
        ]
      }
    ]
  }
];

const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};

const parseTemplateVariables = (rawString, invoiceContext = null) => {
  if (!rawString) return "";
  const ctx = invoiceContext || { 
    id: "INV-DEMO-99", customer: "Alpha Society Test Corp", email: "finance@alphacorp.in", 
    productId: "prod_crm_ent", qty: 1, rate: 45000, total: 53100, date: new Date().toISOString().split("T")[0] 
  };
  
  const prodObj = KYLAS_PRODUCTS.find(p => p.value === ctx.productId);
  const escapeHtml = (unsafe) => String(unsafe)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

  const interpolated = rawString
    .replace(/{{invoice\.id}}/g, escapeHtml(ctx.id))
    .replace(/{{customer\.name}}/g, escapeHtml(ctx.customer))
    .replace(/{{customer\.email}}/g, escapeHtml(ctx.email))
    .replace(/{{product\.name}}/g, escapeHtml(prodObj?.label || ctx.productId))
    .replace(/{{product\.rate}}/g, escapeHtml(`₹${ctx.rate.toLocaleString("en-IN")}`))
    .replace(/{{product\.qty}}/g, escapeHtml(ctx.qty))
    .replace(/{{invoice\.total}}/g, escapeHtml(`₹${ctx.total.toLocaleString("en-IN")}`))
    .replace(/{{current\.date}}/g, escapeHtml(ctx.date || new Date().toISOString().split("T")[0]));

  return DOMPurify.sanitize(interpolated, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'div', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['href', 'target', 'style', 'class'],
  });
};

const buildAdvancedStyles = (adv) => {
  const safeBgImage = (adv?.backgroundImage && isValidUrl(adv.backgroundImage)) 
    ? `url('${typeof window !== "undefined" && window.CSS && window.CSS.escape ? window.CSS.escape(adv.backgroundImage) : adv.backgroundImage.replace(/'/g, "\\'")}')` 
    : "none";

  return {
    margin: `${adv?.marginTop ?? 0}px ${adv?.marginRight ?? 0}px ${adv?.marginBottom ?? 0}px ${adv?.marginLeft ?? 0}px`,
    padding: `${adv?.paddingTop ?? 0}px ${adv?.paddingRight ?? 0}px ${adv?.paddingBottom ?? 0}px ${adv?.paddingLeft ?? 0}px`,
    backgroundColor: adv?.backgroundColor ?? "transparent", 
    backgroundImage: safeBgImage, 
    backgroundSize: adv?.backgroundSize ?? "cover",
    border: adv?.borderType && adv.borderType !== "none" ? `${adv?.borderWidth ?? 0}px ${adv.borderType} ${adv?.borderColor ?? "#e2e8f0"}` : "none",
    borderRadius: `${adv?.borderRadius ?? 0}px`, 
    zIndex: adv?.zIndex ?? 1
  };
};

const SpacingControl = ({ label, data, prefix, updaterFn }) => {
  const [locked, setLocked] = useState(false);
  
  const handleUpdate = (side, val) => {
    if (locked) {
      updaterFn(`${prefix}Top`, val);
      updaterFn(`${prefix}Right`, val);
      updaterFn(`${prefix}Bottom`, val);
      updaterFn(`${prefix}Left`, val);
    } else {
      updaterFn(`${prefix}${side}`, val);
    }
  };

  return (
    <div className={styles.inspectorSectionGroup}>
      <div className={styles.spacingControlHeader}>
        <label className={styles.controlMetaLabel}>{label} (px)</label>
        <button type="button" className={styles.lockIconButton} onClick={() => setLocked(!locked)}>
          {locked ? <FiLock size={12} /> : <FiUnlock size={12} />}
        </button>
      </div>
      <div className={styles.quadInputGrid}>
        <input type="number" placeholder="Top" value={data[`${prefix}Top`] ?? 0} onChange={e => handleUpdate("Top", Number(e.target.value))} />
        <input type="number" placeholder="Right" value={data[`${prefix}Right`] ?? 0} onChange={e => handleUpdate("Right", Number(e.target.value))} />
        <input type="number" placeholder="Bot" value={data[`${prefix}Bottom`] ?? 0} onChange={e => handleUpdate("Bottom", Number(e.target.value))} />
        <input type="number" placeholder="Left" value={data[`${prefix}Left`] ?? 0} onChange={e => handleUpdate("Left", Number(e.target.value))} />
      </div>
    </div>
  );
};

export default function TemplateEditorWorkspace() {
  const router = useRouter();
  const params = useParams();
  
  const [tmplName, setTmplName] = useState("Custom Layout Scheme");
  const [tmplProduct, setTmplProduct] = useState("none");
  const [tmplFormat, setTmplFormat] = useState("a4");
  const [tmplOrientation, setTmplOrientation] = useState("portrait");
  const [tmplSections, setTmplSections] = useState(INITIAL_DEFAULT_LAYOUT);
  const [tmplTheme, setTmplTheme] = useState({ primaryColor: "#27347B", textColor: "#202223", backgroundColor: "#ffffff", borderColor: "#e1e3e5" });
  
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState(null);
  const [autoSaveBadge, setAutoSaveBadge] = useState("All changes saved");
  const [isDragging, setIsDragging] = useState(false);
  const [variableSearch, setVariableSearch] = useState("");
  const [inspectorTab, setInspectorTab] = useState("content");

  const wysiwygRef = useRef(null);

  const currentContext = {
    id: "INV-DEMO-99", 
    customer: "Alpha Society Test Corp", 
    email: "finance@alphacorp.in", 
    productId: tmplProduct !== "none" ? tmplProduct : "prod_crm_ent", 
    qty: 1, 
    rate: tmplProduct === "prod_iot_node" ? 15000 : 45000, 
    total: tmplProduct === "prod_iot_node" ? 17700 : 53100, 
    date: new Date().toISOString().split("T")[0] 
  };

  useEffect(() => {
    setAutoSaveBadge("Autosaving layout architecture...");
    const saveTimer = setTimeout(() => {
      setAutoSaveBadge("Layout state autosaved");
    }, 1200);
    return () => clearTimeout(saveTimer);
  }, [tmplName, tmplProduct, tmplFormat, tmplOrientation, tmplSections, tmplTheme]);

  const copyToClipboard = (text) => {
    if (typeof window !== "undefined" && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert(`Copied variable: ${text}`);
      }).catch(() => fallbackCopyToClipboard(text));
    } else {
      fallbackCopyToClipboard(text);
    }
  };

  const fallbackCopyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; 
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      alert(`Copied variable: ${text}`);
    } catch (err) {}
    document.body.removeChild(textArea);
  };

  const execWysiwygCommand = (command) => {
    if (typeof window === "undefined") return;
    document.execCommand(command, false, null);
    if (selectedWidgetId) {
      const activeEl = document.getElementById(`wysiwyg-${selectedWidgetId}`);
      if (activeEl) {
        handleUpdateWidgetField(selectedWidgetId, "htmlContent", DOMPurify.sanitize(activeEl.innerHTML));
      }
    }
  };

  const handleAddSectionRow = (type = "standard") => {
    const newSection = {
      sectionId: generateId("sec"),
      type,
      style: { backgroundColor: "transparent", backgroundImage: "", paddingTop: "10px", paddingBottom: "10px" },
      columns: [
        { columnId: generateId("col"), width: 100, advanced: { ...DEFAULT_ADVANCED_STYLE }, widgets: [] }
      ]
    };
    
    const footerIdx = tmplSections.findIndex(s => s.sectionId === "sec_global_footer");
    if (footerIdx !== -1) {
      const updated = [...tmplSections];
      updated.splice(footerIdx, 0, newSection);
      setTmplSections(updated);
    } else {
      setTmplSections([...tmplSections, newSection]);
    }
    
    setSelectedSectionId(newSection.sectionId);
    setSelectedColumnId(null);
    setSelectedWidgetId(null);
  };

  const handleUpdateSectionStyle = (sectionId, key, value) => {
    setTmplSections(tmplSections.map(sec => 
      sec.sectionId === sectionId ? { ...sec, style: { ...sec.style, [key]: value } } : sec
    ));
  };

  const handleUpdateColumnStyle = (sectionId, columnId, key, value) => {
    setTmplSections(tmplSections.map(sec => 
      sec.sectionId === sectionId ? { ...sec, columns: sec.columns.map(col => col.columnId === columnId ? { ...col, advanced: { ...col.advanced, [key]: value } } : col) } : sec
    ));
  };

  const handleAddColumnToSection = (sectionId) => {
    setTmplSections(tmplSections.map(sec => {
      if (sec.sectionId !== sectionId) return sec;
      const colCount = sec.columns.length + 1;
      if (colCount > 4) return sec; 
      const equalWidth = Math.floor(100 / colCount);
      return {
        ...sec,
        columns: [...sec.columns, { columnId: generateId("col"), width: equalWidth, advanced: { ...DEFAULT_ADVANCED_STYLE }, widgets: [] }].map(c => ({ ...c, width: equalWidth }))
      };
    }));
  };

  const handleRemoveColumnFromSection = (sectionId, columnId) => {
    setTmplSections(tmplSections.map(sec => {
      if (sec.sectionId !== sectionId) return sec;
      const nextColumns = sec.columns.filter(c => c.columnId !== columnId);
      if (nextColumns.length === 0) return sec;
      const balancedWidth = Math.floor(100 / nextColumns.length);
      return {
        ...sec,
        columns: nextColumns.map(c => ({ ...c, width: balancedWidth }))
      };
    }));
    if (selectedColumnId === columnId) {
      setSelectedColumnId(null);
      setSelectedWidgetId(null);
    }
  };

  const handleResizeColumnWidth = (sectionId, columnId, nextWidth) => {
    setTmplSections(tmplSections.map(sec => {
      if (sec.sectionId !== sectionId) return sec;
      const colIdx = sec.columns.findIndex(c => c.columnId === columnId);
      if (colIdx === -1 || sec.columns.length < 2) return sec;

      const currentWidth = sec.columns[colIdx].width;
      const diff = nextWidth - currentWidth;
      const targetIdx = colIdx + 1 < sec.columns.length ? colIdx + 1 : colIdx - 1;
      const targetCol = sec.columns[targetIdx];

      if (targetCol.width - diff < 10 || nextWidth < 10 || nextWidth > 90) return sec; 

      const newColumns = [...sec.columns];
      newColumns[colIdx] = { ...newColumns[colIdx], width: nextWidth };
      newColumns[targetIdx] = { ...newColumns[targetIdx], width: targetCol.width - diff };

      return { ...sec, columns: newColumns };
    }));
  };

  const handleAddWidgetToColumn = (sectionId, columnId, widgetType) => {
    const registryEntry = ELEMENT_REGISTRY[widgetType];
    if (!registryEntry) return;

    const newWidget = {
      widgetId: generateId("wid"),
      type: widgetType,
      ...registryEntry.config.baselineConfig,
      advanced: { ...DEFAULT_ADVANCED_STYLE }
    };

    setTmplSections(tmplSections.map(sec => {
      if (sec.sectionId !== sectionId) return sec;
      return {
        ...sec,
        columns: sec.columns.map(col => col.columnId === columnId ? { ...col, widgets: [...col.widgets, newWidget] } : col)
      };
    }));
    setSelectedWidgetId(newWidget.widgetId);
  };

  const handleUpdateWidgetField = (widgetId, key, value) => {
    setTmplSections(tmplSections.map(sec => ({
      ...sec,
      columns: sec.columns.map(col => ({
        ...col,
        widgets: col.widgets.map(w => w.widgetId === widgetId ? { ...w, [key]: value } : w)
      }))
    })));
  };

  const handleUpdateWidgetAdvanced = (widgetId, key, value) => {
    setTmplSections(tmplSections.map(sec => ({
      ...sec,
      columns: sec.columns.map(col => ({
        ...col,
        widgets: col.widgets.map(w => w.widgetId === widgetId ? { ...w, advanced: { ...w.advanced, [key]: value } } : w)
      }))
    })));
  };

  const handleUpdateBasicTableCell = (widgetId, rIndex, cIndex, value) => {
    setTmplSections(tmplSections.map(sec => ({
      ...sec,
      columns: sec.columns.map(col => ({
        ...col,
        widgets: col.widgets.map(w => {
          if (w.widgetId !== widgetId || w.type !== "basic_table") return w;
          const newData = w.tableData.map((row, r) => 
            r === rIndex ? row.map((cell, c) => c === cIndex ? value : cell) : row
          );
          return { ...w, tableData: newData };
        })
      }))
    })));
  };

  const handleAddBasicTableRow = (widgetId) => {
    setTmplSections(tmplSections.map(sec => ({
      ...sec,
      columns: sec.columns.map(col => ({
        ...col,
        widgets: col.widgets.map(w => {
          if (w.widgetId !== widgetId || w.type !== "basic_table") return w;
          const colCount = w.tableData[0]?.length || 1;
          const newRow = Array(colCount).fill("New Cell");
          return { ...w, tableData: [...w.tableData, newRow] };
        })
      }))
    })));
  };

  const handleRemoveBasicTableRow = (widgetId, rIndex) => {
    setTmplSections(tmplSections.map(sec => ({
      ...sec,
      columns: sec.columns.map(col => ({
        ...col,
        widgets: col.widgets.map(w => {
          if (w.widgetId !== widgetId || w.type !== "basic_table") return w;
          if (w.tableData.length <= 1) return w;
          return { ...w, tableData: w.tableData.filter((_, i) => i !== rIndex) };
        })
      }))
    })));
  };

  const handleAddBasicTableCol = (widgetId) => {
    setTmplSections(tmplSections.map(sec => ({
      ...sec,
      columns: sec.columns.map(col => ({
        ...col,
        widgets: col.widgets.map(w => {
          if (w.widgetId !== widgetId || w.type !== "basic_table") return w;
          return { ...w, tableData: w.tableData.map(row => [...row, "New Col"]) };
        })
      }))
    })));
  };

  const handleRemoveBasicTableCol = (widgetId, cIndex) => {
    setTmplSections(tmplSections.map(sec => ({
      ...sec,
      columns: sec.columns.map(col => ({
        ...col,
        widgets: col.widgets.map(w => {
          if (w.widgetId !== widgetId || w.type !== "basic_table") return w;
          if (w.tableData[0]?.length <= 1) return w;
          return { ...w, tableData: w.tableData.map(row => row.filter((_, i) => i !== cIndex)) };
        })
      }))
    })));
  };

  const handleRemoveWidget = (widgetId) => {
    setTmplSections(tmplSections.map(sec => ({
      ...sec,
      columns: sec.columns.map(col => ({
        ...col,
        widgets: col.widgets.filter(w => w.widgetId !== widgetId)
      }))
    })));
    if (selectedWidgetId === widgetId) setSelectedWidgetId(null);
  };

  const handleRemoveSectionRow = (sectionId) => {
    if (sectionId === "sec_global_header" || sectionId === "sec_global_footer") return;
    setTmplSections(tmplSections.filter(sec => sec.sectionId !== sectionId));
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
      setSelectedColumnId(null);
      setSelectedWidgetId(null);
    }
  };

  const handleMoveWidgetAcrossColumns = (fromSecId, fromColId, widgetId, toSecId, toColId) => {
    setTmplSections(prev => {
      let movedWidget = null;
      const extracted = prev.map(s => {
         if (s.sectionId !== fromSecId) return s;
         return {
           ...s,
           columns: s.columns.map(c => {
             if (c.columnId !== fromColId) return c;
             movedWidget = c.widgets.find(w => w.widgetId === widgetId);
             return { ...c, widgets: c.widgets.filter(w => w.widgetId !== widgetId) };
           })
         }
      });
      if (!movedWidget) return prev;
      return extracted.map(s => {
         if (s.sectionId !== toSecId) return s;
         return {
           ...s,
           columns: s.columns.map(c => {
             if (c.columnId !== toColId) return c;
             return { ...c, widgets: [...c.widgets, movedWidget] };
           })
         }
      });
    });
  };

  const renderDynamicControlField = (field, widget) => {
    switch (field.type) {
      case "text":
      case "number":
        return (
          <div key={field.id} className={styles.controlGroupBlock}>
            <label className={styles.controlMetaLabel}>{field.label}</label>
            <input 
              type={field.type} 
              className={styles.builderTextInputField} 
              value={widget[field.id] ?? ""} 
              onChange={(e) => handleUpdateWidgetField(widget.widgetId, field.id, field.type === "number" ? Number(e.target.value) : e.target.value)} 
            />
          </div>
        );
      case "textarea":
        return (
          <div key={field.id} className={styles.controlGroupBlock}>
            <label className={styles.controlMetaLabel}>{field.label}</label>
            <textarea 
              className={styles.builderTextareaInputField} 
              rows={field.rows ?? 3} 
              value={widget[field.id] ?? ""} 
              onChange={(e) => handleUpdateWidgetField(widget.widgetId, field.id, e.target.value)} 
            />
          </div>
        );
      case "select":
        return (
          <div key={field.id} className={styles.controlGroupBlock}>
            <label className={styles.controlMetaLabel}>{field.label}</label>
            <select 
              className={styles.builderSelectField} 
              value={widget[field.id] ?? ""} 
              onChange={(e) => handleUpdateWidgetField(widget.widgetId, field.id, e.target.value)}
            >
              {field.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        );
      case "color":
        return (
          <div key={field.id} className={styles.controlGroupBlock}>
            <label className={styles.controlMetaLabel}>{field.label}</label>
            <input 
              type="color" 
              className={styles.colorInputElementNode} 
              value={widget[field.id] ?? "#000000"} 
              onChange={(e) => handleUpdateWidgetField(widget.widgetId, field.id, e.target.value)} 
            />
          </div>
        );
      case "alignment_picker":
        return (
          <div key={field.id} className={styles.controlGroupBlock}>
            <label className={styles.controlMetaLabel}>{field.label}</label>
            {renderAlignmentControl(widget[field.id] ?? "left", (k, v) => handleUpdateWidgetField(widget.widgetId, field.id, v), field.id)}
          </div>
        );
      case "wysiwyg":
        return (
          <div key={field.id} className={styles.controlGroupBlock}>
            <label className={styles.controlMetaLabel}>{field.label}</label>
            <div className={styles.wysiwygToolbarActionButtonsStripRow}>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); execWysiwygCommand("bold"); }}><FiBold /></button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); execWysiwygCommand("italic"); }}><FiItalic /></button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); execWysiwygCommand("underline"); }}><FiUnderline /></button>
            </div>
            <div 
              id={`wysiwyg-${widget.widgetId}`}
              className={styles.wysiwygContentEditableContainerBodyArea} 
              contentEditable 
              suppressContentEditableWarning 
              onInput={(e) => handleUpdateWidgetField(widget.widgetId, field.id, DOMPurify.sanitize(e.currentTarget.innerHTML))} 
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(widget[field.id] ?? "") }} 
            />
          </div>
        );
      case "basic_table_matrix":
        return (
          <div key={field.id} className={styles.inspectorSectionGroup}>
            <div className={styles.settingsCardHeaderBlockRow} style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: "8px" }}>
              <label className={styles.controlMetaLabel}>{field.label}</label>
              <div className={styles.flexRowControls}>
                 <button type="button" className={styles.miniGridActionBtn} onClick={() => handleAddBasicTableRow(widget.widgetId)}>+ Row</button>
                 <button type="button" className={styles.miniGridActionBtn} onClick={() => handleAddBasicTableCol(widget.widgetId)}>+ Col</button>
              </div>
            </div>
            <div className={styles.dataGridEditorContainer}>
               {widget.tableData?.map((row, rIdx) => (
                 <div key={rIdx} className={styles.dataGridEditorRow}>
                   {row.map((cell, cIdx) => (
                     <div key={cIdx} className={styles.dataGridCellWrapper}>
                       <input 
                         type="text" 
                         className={styles.builderTextInputField} 
                         style={{ height: '30px', fontSize: '11px', padding: '0 6px' }}
                         value={cell} 
                         onChange={(e) => handleUpdateBasicTableCell(widget.widgetId, rIdx, cIdx, e.target.value)} 
                       />
                       {rIdx === 0 && <button type="button" className={styles.miniGridDeleteColBtn} onClick={() => handleRemoveBasicTableCol(widget.widgetId, cIdx)}>&times;</button>}
                     </div>
                   ))}
                   <button type="button" className={styles.miniGridDeleteRowBtn} onClick={() => handleRemoveBasicTableRow(widget.widgetId, rIdx)}>&times;</button>
                 </div>
               ))}
            </div>
          </div>
        );
      case "checkbox":
        return (
          <div key={field.id} className={styles.controlGroupBlock}>
             <label className={styles.checkboxLabelWrapper}>
               <input type="checkbox" checked={widget[field.id] ?? false} onChange={(e) => handleUpdateWidgetField(widget.widgetId, field.id, e.target.checked)} />
               <span className={styles.controlMetaLabel} style={{margin:0, marginLeft:'8px'}}>{field.label}</span>
             </label>
          </div>
        );
      default:
        return null;
    }
  };

  const activeWidget = tmplSections.flatMap(s => s.columns.flatMap(c => c.widgets)).find(w => w.widgetId === selectedWidgetId);
  const activeSelectedColumn = tmplSections.flatMap(s => s.columns.map(c => ({ ...c, sectionId: s.sectionId }))).find(c => c.columnId === selectedColumnId);
  const activeSelectedSection = tmplSections.find(s => s.sectionId === selectedSectionId);
  const filteredVariables = VARIABLE_DICTIONARY.filter(v => v.token.toLowerCase().includes(variableSearch.toLowerCase()) || v.description.toLowerCase().includes(variableSearch.toLowerCase()));
  const activeWidgetSchema = activeWidget ? ELEMENT_REGISTRY[activeWidget.type]?.config : null;

  return (
    <div className={styles.adminLayout}>
      <Sidebar activeId="invoices" />
      <main className={styles.mainCanvas}>
        <div className={styles.pageMaxWidth}>
          <header className={styles.pageHeader}>
            <div className={styles.headerLeftBlock}>
              <button className={styles.backButton} onClick={() => router.push("/invoices/templates")} title="Return to Directory"><FiArrowLeft /></button>
              <div className={styles.headerTitle}>
                <div className={styles.builderTitleFlexRow}>
                  <h1>PDF Section Blueprint Studio</h1>
                  <span className={styles.autoSaveStatusBadge}>{autoSaveBadge}</span>
                </div>
                <p>Configure advanced structural parameters and map billing parameters down to granular table coordinates</p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <AdminButton variant="primary" icon={FiCheck} onClick={() => router.push("/invoices/templates")}>Finish Designing</AdminButton>
            </div>
          </header>

          <div className={styles.builderWorkspaceWrapper}>
            <div className={styles.builderSidebarControls}>
              {!selectedSectionId && !activeWidget && !activeSelectedColumn && (
                <>
                  <div className={styles.inspectorTabsStrip}><button className={styles.tabActive}>Document Setup</button></div>
                  <div className={styles.controlGroupBlock}><label className={styles.controlMetaLabel}>Template Identifier Name</label><input type="text" className={styles.builderTextInputField} value={tmplName} onChange={e => setTmplName(e.target.value)} /></div>
                  
                  <div className={styles.controlGroupBlock}>
                    <label className={styles.controlMetaLabel}>Override Priority Trigger</label>
                    <Dropdown 
                      options={[{ value: "none", label: "General template (No trigger override)" }, ...KYLAS_PRODUCTS]} 
                      selected={tmplProduct} 
                      onSelect={(val) => setTmplProduct(val)} 
                    />
                  </div>

                  <div className={styles.formRowTwoColumnGrid}>
                    <div className={styles.controlGroupBlock}>
                      <label className={styles.controlMetaLabel}>Page Size Format</label>
                      <Dropdown 
                        options={[{ value: "a4", label: "DIN A4 Standard" }, { value: "letter", label: "US Letter Sheet" }, { value: "legal", label: "US Legal Size" }]} 
                        selected={tmplFormat} 
                        onSelect={(val) => setTmplFormat(val)} 
                      />
                    </div>
                    <div className={styles.controlGroupBlock}>
                      <label className={styles.controlMetaLabel}>Page Orientation</label>
                      <Dropdown 
                        options={[{ value: "portrait", label: "Portrait Vertical" }, { value: "landscape", label: "Landscape Horiz" }]} 
                        selected={tmplOrientation} 
                        onSelect={(val) => setTmplOrientation(val)} 
                      />
                    </div>
                  </div>

                  <div className={styles.themeCustomizationWidgetBoxContainer}>
                    <label className={styles.controlMetaLabel}>Global Token Colors Map</label>
                    <div className={styles.themeFormInputsDualGridInlineRow}>
                      <div className={styles.controlGroupBlock}><span className={styles.inlineColorLabelMini}>Brand Accent</span><input type="color" className={styles.colorInputElementNode} value={tmplTheme.primaryColor} onChange={(e) => setTmplTheme({ ...tmplTheme, primaryColor: e.target.value })} /></div>
                      <div className={styles.controlGroupBlock}><span className={styles.inlineColorLabelMini}>Font Text</span><input type="color" className={styles.colorInputElementNode} value={tmplTheme.textColor} onChange={(e) => setTmplTheme({ ...tmplTheme, textColor: e.target.value })} /></div>
                      <div className={styles.controlGroupBlock}><span className={styles.inlineColorLabelMini}>Sheet BG</span><input type="color" className={styles.colorInputElementNode} value={tmplTheme.backgroundColor} onChange={(e) => setTmplTheme({ ...tmplTheme, backgroundColor: e.target.value })} /></div>
                      <div className={styles.controlGroupBlock}><span className={styles.inlineColorLabelMini}>Grid Border</span><input type="color" className={styles.colorInputElementNode} value={tmplTheme.borderColor} onChange={(e) => setTmplTheme({ ...tmplTheme, borderColor: e.target.value })} /></div>
                    </div>
                  </div>

                  <div className={styles.componentAssetLibraryCardTrayBlock} style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
                    <label className={styles.controlMetaLabel}>Available Grid Elements</label>
                    <div className={styles.globalAssetListInstructionalText}>Select a column on the canvas layout sheet to inject these modules:</div>
                    <div className={styles.componentAssetIconsGridMatrixItemsStack}>
                      {AVAILABLE_ASSETS.map(asset => {
                        const Icon = asset.icon;
                        return (
                          <div key={asset.type} className={styles.disabledPaletteAssetItemCard}>
                            <Icon /> <span>{asset.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button className={styles.layoutActionInjectBtnNode} onClick={() => handleAddSectionRow("standard")}><FiPlus /> Append Row Container</button>
                </>
              )}

              {activeSelectedSection && !selectedColumnId && !selectedWidgetId && (
                <div className={styles.inlineComponentSettingsEditorCard}>
                  <div className={styles.settingsCardHeaderBlockRow}><h6>Section Layer Attributes</h6><button className={styles.dismissSettingsBtn} onClick={() => setSelectedSectionId(null)}>&times;</button></div>
                  <div className={styles.inspectorTabsStrip}>
                    <button className={inspectorTab === "content" ? styles.tabActive : ""} onClick={() => setInspectorTab("content")}>Content</button>
                    <button className={inspectorTab === "advanced" ? styles.tabActive : ""} onClick={() => setInspectorTab("advanced")}>Advanced</button>
                  </div>
                  {inspectorTab === "content" && (
                    <div className={styles.controlGroupBlock} style={{marginTop: "12px"}}>
                      <label className={styles.controlMetaLabel}>Background Fill</label>
                      <input type="color" className={styles.colorInputElementNode} value={activeSelectedSection.style?.backgroundColor ?? "#ffffff"} onChange={(e) => handleUpdateSectionStyle(selectedSectionId, "backgroundColor", e.target.value)} />
                    </div>
                  )}
                  {inspectorTab === "advanced" && renderAdvancedInspector(activeSelectedSection.style, (k, v) => handleUpdateSectionStyle(selectedSectionId, k, v))}
                </div>
              )}

              {activeSelectedColumn && !activeWidget && (
                <div className={styles.sidebarColumnManagerBoxPanel}>
                  <div className={styles.sidebarColumnMetaLabelRow}><span>Active Grid Column Layout</span><button className={styles.dismissSettingsBtnMini} onClick={() => setSelectedColumnId(null)}>&times;</button></div>
                  <div className={styles.inspectorTabsStrip}>
                    <button className={inspectorTab === "content" ? styles.tabActive : ""} onClick={() => setInspectorTab("content")}>Content</button>
                    <button className={inspectorTab === "advanced" ? styles.tabActive : ""} onClick={() => setInspectorTab("advanced")}>Advanced</button>
                  </div>
                  
                  {inspectorTab === "content" && (
                    <>
                      <div className={styles.sidebarColumnSliderControlRow} style={{ marginTop: "12px" }}>
                        <label>Flex Grid Width: {activeSelectedColumn.width}%</label>
                        <input type="range" min="10" max="90" value={activeSelectedColumn.width} onChange={(e) => handleResizeColumnWidth(activeSelectedColumn.sectionId, activeSelectedColumn.columnId, Number(e.target.value))} />
                      </div>
                      
                      <div className={styles.componentAssetLibraryCardTrayBlock} style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px", marginTop: "10px" }}>
                        <label className={styles.controlMetaLabel}>Components Deck Shelf</label>
                        <div className={styles.componentAssetIconsGridMatrixItemsStack}>
                          {AVAILABLE_ASSETS.map(asset => {
                            const Icon = asset.icon;
                            return (
                              <button key={asset.type} onClick={() => handleAddWidgetToColumn(selectedSectionId, selectedColumnId, asset.type)} draggable onDragStart={e => { e.dataTransfer.setData("new_widget", asset.type); setIsDragging(true); }} onDragEnd={() => setIsDragging(false)}>
                                <Icon /> <span>{asset.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button type="button" className={styles.sidebarDeleteColumnBtnLine} style={{ marginTop: "12px" }} onClick={() => handleRemoveColumnFromSection(activeSelectedColumn.sectionId, activeSelectedColumn.columnId)}><FiTrash2 /> Remove Selected Column Node</button>
                    </>
                  )}
                  
                  {inspectorTab === "advanced" && renderAdvancedInspector(activeSelectedColumn.advanced, (k, v) => handleUpdateColumnStyle(activeSelectedColumn.sectionId, activeSelectedColumn.columnId, k, v))}
                </div>
              )}

              {activeWidget && (
                <div className={styles.inlineComponentSettingsEditorCard}>
                  <div className={styles.settingsCardHeaderBlockRow}><h6>{activeWidget.type.toUpperCase().replace("_", " ")} Node Property</h6><button className={styles.dismissSettingsBtn} onClick={() => setSelectedWidgetId(null)}>&times;</button></div>
                  <div className={styles.inspectorTabsStrip}>
                    <button className={inspectorTab === "content" ? styles.tabActive : ""} onClick={() => setInspectorTab("content")}>Content</button>
                    <button className={inspectorTab === "style" ? styles.tabActive : ""} onClick={() => setInspectorTab("style")}>Style</button>
                    <button className={inspectorTab === "advanced" ? styles.tabActive : ""} onClick={() => setInspectorTab("advanced")}>Advanced</button>
                  </div>

                  {inspectorTab === "advanced" && renderAdvancedInspector(activeWidget.advanced, (k, v) => handleUpdateWidgetAdvanced(activeWidget.widgetId, k, v))}

                  {(inspectorTab === "content" || inspectorTab === "style") && (
                    <div className={styles.inspectorTabBody}>
                      {activeWidgetSchema?.fields[inspectorTab]?.map(field => renderDynamicControlField(field, activeWidget))}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.apiVariablesDictionaryReferenceGuideCardBlock}>
                <label className={styles.controlMetaLabel}>Kylas Variable Glossary Tokens</label>
                <div className={styles.searchVariableInputContainer}>
                  <FiSearch className={styles.searchVariableInputIcon} />
                  <input type="text" className={styles.builderTextInputField} placeholder="Fuzzy find tokens..." value={variableSearch} onChange={(e) => setVariableSearch(e.target.value)} />
                </div>
                <div className={styles.dictionaryListItemsScrollingStack}>
                  {filteredVariables.map((v) => (
                    <div key={v.token} className={styles.dictionaryRowCardItemLine} onClick={() => copyToClipboard(v.token)}>
                      <code className={styles.dictionaryTokenFieldCodeHighlight}>{v.token}</code>
                      <span>{v.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.builderPreviewContainerPlane}>
              <div className={styles.previewToolbarDeviceFilterRow}>
                <span className={styles.pdfSimIndicatorLabel}><FiPrinter /> Simulated Print Workspace ({tmplFormat.toUpperCase()} {tmplOrientation})</span>
              </div>
              <div className={styles.canvasPreviewViewportFrameA4AestheticSheet}>
                <div className={styles.pdfInvoiceLayoutContainerMock} style={{ width: DOC_DIMENSIONS[tmplFormat][tmplOrientation].width, minHeight: DOC_DIMENSIONS[tmplFormat][tmplOrientation].height, backgroundColor: tmplTheme.backgroundColor, borderColor: tmplTheme.borderColor }}>
                  {tmplSections.map((sec) => {
                    const isSystemSec = sec.sectionId === "sec_global_header" || sec.sectionId === "sec_global_footer";
                    return (
                      <div 
                        key={sec.sectionId} 
                        className={`${styles.renderedCanvasSectionRow} ${selectedSectionId === sec.sectionId ? styles.sectionRowActiveSelected : ""}`}
                        style={{
                          margin: `${sec.style?.marginTop ?? 0}px ${sec.style?.marginRight ?? 0}px ${sec.style?.marginBottom ?? 0}px ${sec.style?.marginLeft ?? 0}px`,
                          padding: `${sec.style?.paddingTop ?? 0}px ${sec.style?.paddingRight ?? 0}px ${sec.style?.paddingBottom ?? 0}px ${sec.style?.paddingLeft ?? 0}px`,
                          backgroundColor: sec.style?.backgroundColor ?? "transparent"
                        }}
                        onClick={(e) => { e.stopPropagation(); setSelectedSectionId(sec.sectionId); setSelectedColumnId(null); setSelectedWidgetId(null); }}
                      >
                        <div className={styles.sectionRowActionFloatingOverlay}>
                          {!isSystemSec && <button type="button" className={styles.actionBtnMiniPurge} onClick={(e) => { e.stopPropagation(); handleRemoveSectionRow(sec.sectionId); }}>&times;</button>}
                          <button type="button" className={styles.actionBtnMiniAdd} onClick={(e) => { e.stopPropagation(); handleAddColumnToSection(sec.sectionId); }}>+ Grid Col</button>
                        </div>

                        <div className={styles.flexGridColumnsContainerRow}>
                          {sec.columns.map((col) => (
                            <div 
                              key={col.columnId}
                              className={`${styles.renderedCanvasColumnNode} ${selectedColumnId === col.columnId ? styles.columnNodeActiveSelected : ""} ${isDragging ? styles.dropZoneCandidateHighlight : ""}`}
                              style={{ flex: `0 0 ${col.width}%`, width: `${col.width}%`, ...buildAdvancedStyles(col.advanced) }}
                              onClick={(e) => { e.stopPropagation(); setSelectedSectionId(sec.sectionId); setSelectedColumnId(col.columnId); setSelectedWidgetId(null); }}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault(); e.stopPropagation(); setIsDragging(false);
                                const newWidgetType = e.dataTransfer.getData("new_widget");
                                if (newWidgetType) { handleAddWidgetToColumn(sec.sectionId, col.columnId, newWidgetType); return; }
                                const moveDataStr = e.dataTransfer.getData("move_widget");
                                if (moveDataStr) {
                                   try {
                                     const moveData = JSON.parse(moveDataStr);
                                     handleMoveWidgetAcrossColumns(moveData.sectionId, moveData.columnId, moveData.widgetId, sec.sectionId, col.columnId);
                                   } catch (err) {}
                                }
                              }}
                            >
                              <button type="button" className={styles.actionBtnColumnMiniPurge} onClick={(e) => { e.stopPropagation(); handleRemoveColumnFromSection(sec.sectionId, col.columnId); }} title="Remove Column Node">&times;</button>
                              
                              <div className={styles.columnWidgetsVerticalStackList}>
                                {col.widgets.map((widget) => {
                                  const isSelected = selectedWidgetId === widget.widgetId;
                                  const RegistryEntry = ELEMENT_REGISTRY[widget.type];
                                  const ComponentToRender = RegistryEntry?.component;
                                  return (
                                    <div 
                                      key={widget.widgetId}
                                      draggable
                                      onDragStart={(e) => { e.dataTransfer.setData("move_widget", JSON.stringify({ sectionId: sec.sectionId, columnId: col.columnId, widgetId: widget.widgetId })); setIsDragging(true); e.stopPropagation(); }}
                                      onDragEnd={() => setIsDragging(false)}
                                      className={`${styles.canvasWidgetRenderLeafNode} ${isSelected ? styles.widgetLeafActiveSelected : ""}`}
                                      style={{ ...buildAdvancedStyles(widget.advanced) }}
                                      onClick={(e) => { e.stopPropagation(); setSelectedSectionId(sec.sectionId); setSelectedColumnId(col.columnId); setSelectedWidgetId(widget.widgetId); setInspectorTab("content"); }}
                                    >
                                      {isSelected && (
                                        <div className={styles.widgetOverlayToolbarTopRight}>
                                          <button type="button" className={styles.widgetPurgeMiniBtnFloating} onClick={(e) => { e.stopPropagation(); handleRemoveWidget(widget.widgetId); }}>&times;</button>
                                          <span className={styles.widgetDragHandleIndicator}><FiMove /></span>
                                        </div>
                                      )}

                                      {ComponentToRender && (
                                        <ComponentToRender 
                                          widget={widget} 
                                          parseFn={parseTemplateVariables} 
                                          context={currentContext} 
                                          styles={styles} 
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                                {col.widgets.length === 0 && <div className={styles.emptyColumnDropzone}>Empty Column Content</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}