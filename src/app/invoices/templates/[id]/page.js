"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  FiPlus, FiTrash2, FiCheck, FiArrowLeft, FiPrinter, FiFileText, FiSliders, 
  FiVideo, FiList, FiImage, FiGrid, FiCode, FiType, FiSearch, FiSettings, 
  FiMove, FiBold, FiItalic, FiUnderline
} from "react-icons/fi";
import Sidebar from "@/components/layout/sidebar/sidebar";
import AdminButton from "@/components/ui/button/button";
import Dropdown from "@/components/ui/dropdown/dropdown";
import styles from "./editor.module.css";

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
  borderType: "none", borderWidth: 0, borderColor: "#e1e3e5", borderRadius: 0, zIndex: 1
};

const DEFAULT_TYPOGRAPHY = {
  fontFamily: "Poppins", fontSize: 13, fontWeight: "400", textTransform: "none", 
  textDecoration: "none", lineHeight: 1.5, letterSpacing: 0
};

const INITIAL_DEFAULT_LAYOUT = [
  {
    sectionId: "sec_header",
    type: "header",
    style: { backgroundColor: "#27347B", backgroundImage: "", paddingTop: "15px", paddingBottom: "15px" },
    columns: [
      {
        columnId: "col_h1",
        width: 100,
        widgets: [
          { widgetId: "w_h1", type: "header", text: "TAX INVOICE STATEMENT", textAlign: "center", fontSize: 22, textColor: "#ffffff", htmlTag: "h2", advanced: { ...DEFAULT_ADVANCED_STYLE } }
        ]
      }
    ]
  },
  {
    sectionId: "sec_table",
    type: "standard",
    style: { backgroundColor: "#ffffff", backgroundImage: "", paddingTop: "12px", paddingBottom: "12px" },
    columns: [
      {
        columnId: "col_t1",
        width: 100,
        widgets: [
          { widgetId: "w_tbl1", type: "table", headerBg: "#fafbfc", headerText: "#6d7175", headerAlign: "left", contentAlign: "left", headerPadding: 12, contentPadding: 12, borderColor: "#e1e3e5", zebra: true, advanced: { ...DEFAULT_ADVANCED_STYLE } }
        ]
      }
    ]
  }
];

const parseTemplateVariables = (rawString, invoiceContext = null) => {
  if (!rawString) return "";
  const ctx = invoiceContext || { id: "INV-DEMO-99", customer: "Alpha Society Test Corp", email: "finance@alphacorp.in", productId: "prod_crm_ent", qty: 1, rate: 45000, total: 53100, date: new Date().toISOString().split("T")[0] };
  const prodObj = KYLAS_PRODUCTS.find(p => p.value === ctx.productId);
  return rawString
    .replace(/{{invoice\.id}}/g, ctx.id)
    .replace(/{{customer\.name}}/g, ctx.customer)
    .replace(/{{customer\.email}}/g, ctx.email)
    .replace(/{{product\.name}}/g, prodObj?.label || ctx.productId)
    .replace(/{{product\.rate}}/g, `₹${ctx.rate.toLocaleString("en-IN")}`)
    .replace(/{{product\.qty}}/g, ctx.qty)
    .replace(/{{invoice\.total}}/g, `₹${ctx.total.toLocaleString("en-IN")}`)
    .replace(/{{current\.date}}/g, ctx.date || new Date().toISOString().split("T")[0]);
};

const buildAdvancedStyles = (adv) => ({
  margin: `${adv?.marginTop || 0}px ${adv?.marginRight || 0}px ${adv?.marginBottom || 0}px ${adv?.marginLeft || 0}px`,
  padding: `${adv?.paddingTop || 0}px ${adv?.paddingRight || 0}px ${adv?.paddingBottom || 0}px ${adv?.paddingLeft || 0}px`,
  backgroundColor: adv?.backgroundColor || "transparent", backgroundImage: adv?.backgroundImage ? `url(${adv.backgroundImage})` : "none", backgroundSize: adv?.backgroundSize || "cover",
  border: adv?.borderType && adv.borderType !== "none" ? `${adv.borderWidth}px ${adv.borderType} ${adv.borderColor}` : "none",
  borderRadius: `${adv?.borderRadius || 0}px`, zIndex: adv?.zIndex || 1
});

const buildTypographyStyles = (w) => ({
  fontFamily: `var(--font-${w.fontFamily?.toLowerCase() || "poppins"}), sans-serif`, fontSize: `${w.fontSize || 13}px`,
  fontWeight: w.fontWeight || "400", textTransform: w.textTransform || "none", textDecoration: w.textDecoration || "none",
  lineHeight: w.lineHeight || 1.5, letterSpacing: `${w.letterSpacing || 0}px`, color: w.textColor || "inherit"
});

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

  useEffect(() => {
    setAutoSaveBadge("Autosaving layout architecture...");
    const saveTimer = setTimeout(() => {
      setAutoSaveBadge("Layout state autosaved");
    }, 1200);
    return () => setTimeout(saveTimer);
  }, [tmplName, tmplProduct, tmplFormat, tmplOrientation, tmplSections, tmplTheme]);

  const copyToClipboard = (text) => {
    if (typeof window !== "undefined" && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert(`Copied variable to clipboard: ${text}`);
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
      alert(`Copied variable to clipboard: ${text}`);
    } catch (err) {
      console.error("Fallback clipboard loop failed", err);
    }
    document.body.removeChild(textArea);
  };

  const execWysiwygCommand = (command) => {
    document.execCommand(command, false, null);
    if (wysiwygRef.current && selectedWidgetId) {
      handleUpdateWidgetField(selectedWidgetId, "htmlContent", wysiwygRef.current.innerHTML);
    }
  };

  const handleAddSectionRow = (type = "standard") => {
    const newSection = {
      sectionId: `sec_${Date.now()}`,
      type,
      style: { backgroundColor: "transparent", backgroundImage: "", paddingTop: "10px", paddingBottom: "10px" },
      columns: [
        { columnId: `col_${Date.now()}_1`, width: 100, widgets: [] }
      ]
    };
    setTmplSections([...tmplSections, newSection]);
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
        columns: [...sec.columns, { columnId: `col_${Date.now()}`, width: equalWidth, advanced: { ...DEFAULT_ADVANCED_STYLE }, widgets: [] }].map(c => ({ ...c, width: equalWidth }))
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

      if (targetCol.width - diff < 10 || nextWidth < 10) return sec; 

      const newColumns = [...sec.columns];
      newColumns[colIdx] = { ...newColumns[colIdx], width: nextWidth };
      newColumns[targetIdx] = { ...newColumns[targetIdx], width: targetCol.width - diff };

      return { ...sec, columns: newColumns };
    }));
  };

  const handleAddWidgetToColumn = (sectionId, columnId, widgetType) => {
    const baselineConfigs = {
      header: { text: "INVOICE DISPATCH", htmlTag: "h2", textAlign: "center", fontSize: 24, textColor: "#27347B", ...DEFAULT_TYPOGRAPHY, fontFamily: "Montserrat", fontWeight: "700", advanced: { ...DEFAULT_ADVANCED_STYLE } },
      subtitle: { text: "Document Subheading Context Row", htmlTag: "h4", textAlign: "left", fontSize: 14, textColor: "#454f5b", ...DEFAULT_TYPOGRAPHY, fontFamily: "Montserrat", fontWeight: "600", advanced: { ...DEFAULT_ADVANCED_STYLE } },
      text: { htmlContent: "<div>Add copy writing strings natively here.</div>", alignment: "left", textColor: "#202223", ...DEFAULT_TYPOGRAPHY, advanced: { ...DEFAULT_ADVANCED_STYLE } },
      list: { text: "First Item Leaf Row\nSecond Sequenced Row Element", listType: "bullet", fontSize: 12, textColor: "", markerColor: "", iconSpacing: 8, itemSpacing: 6, advanced: { ...DEFAULT_ADVANCED_STYLE } },
      image: { imageUrl: "", widthMode: "%", widthValue: 30, borderRadius: 0, borderSize: 0, borderColor: "#e1e3e5", alignment: "left", opacity: 1, objectFit: "contain", advanced: { ...DEFAULT_ADVANCED_STYLE } },
      video: { videoUrl: "", widthValue: 100, advanced: { ...DEFAULT_ADVANCED_STYLE } },
      table: { headerBg: "#fafbfc", headerText: "#6d7175", headerAlign: "center", contentAlign: "left", headerPadding: 10, contentPadding: 12, borderColor: "#e1e3e5", zebra: true, advanced: { ...DEFAULT_ADVANCED_STYLE } },
      metadata: { text: "Variable Node Key: Value", labelColor: "#6d7175", valueColor: "#202223", backgroundColor: "#fafbfc", borderColor: "#e1e3e5", layoutStyle: "vertical", advanced: { ...DEFAULT_ADVANCED_STYLE } },
      signoff: { text: "Authorized Sign-off Strip Block", name: "Authorized Signatory", title: "AsmitA Operations", signatureUrl: "", stampUrl: "", lineWidth: 1, lineColor: "#202223", lineStyle: "solid", marginTop: 40, alignment: "right", advanced: { ...DEFAULT_ADVANCED_STYLE } }
    };

    const newWidget = {
      widgetId: `wid_${Date.now()}`,
      type: widgetType,
      ...baselineConfigs[widgetType]
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

  const renderAdvancedInspector = (advData, updaterFn) => {
    const data = advData || DEFAULT_ADVANCED_STYLE;
    return (
      <div className={styles.inspectorTabBody}>
        <div className={styles.inspectorSectionGroup}>
          <label className={styles.controlMetaLabel}>Margin Parameters (px)</label>
          <div className={styles.quadInputGrid}>
            <input type="number" placeholder="Top" value={data.marginTop || 0} onChange={e => updaterFn("marginTop", Number(e.target.value))} />
            <input type="number" placeholder="Right" value={data.marginRight || 0} onChange={e => updaterFn("marginRight", Number(e.target.value))} />
            <input type="number" placeholder="Bot" value={data.marginBottom || 0} onChange={e => updaterFn("marginBottom", Number(e.target.value))} />
            <input type="number" placeholder="Left" value={data.marginLeft || 0} onChange={e => updaterFn("marginLeft", Number(e.target.value))} />
          </div>
        </div>
        <div className={styles.inspectorSectionGroup}>
          <label className={styles.controlMetaLabel}>Padding Parameters (px)</label>
          <div className={styles.quadInputGrid}>
            <input type="number" placeholder="Top" value={data.paddingTop || 0} onChange={e => updaterFn("paddingTop", Number(e.target.value))} />
            <input type="number" placeholder="Right" value={data.paddingRight || 0} onChange={e => updaterFn("paddingRight", Number(e.target.value))} />
            <input type="number" placeholder="Bot" value={data.paddingBottom || 0} onChange={e => updaterFn("paddingBottom", Number(e.target.value))} />
            <input type="number" placeholder="Left" value={data.paddingLeft || 0} onChange={e => updaterFn("paddingLeft", Number(e.target.value))} />
          </div>
        </div>
        <div className={styles.inspectorSectionGroup}>
          <label className={styles.controlMetaLabel}>Border Edge Controls</label>
          <div className={styles.formRowTwoColumnGrid}>
            <input type="color" className={styles.colorInputElementNode} value={data.borderColor || "#e1e3e5"} onChange={e => updaterFn("borderColor", e.target.value)} />
            <input type="number" placeholder="Radius px" className={styles.builderTextInputField} value={data.borderRadius || 0} onChange={e => updaterFn("borderRadius", Number(e.target.value))} />
          </div>
        </div>
        <div className={styles.inspectorSectionGroup}>
          <label className={styles.controlMetaLabel}>Z-Index Depth Layer</label>
          <input type="number" className={styles.builderTextInputField} value={data.zIndex || 1} onChange={e => updaterFn("zIndex", Number(e.target.value))} />
        </div>
      </div>
    );
  };

  const renderTypographyInspector = (dataObj, updaterFn) => (
    <div className={styles.inspectorSectionGroup}>
      <label className={styles.controlMetaLabel}>Typography Module</label>
      <div className={styles.typoGridRow}>
        <select className={styles.builderSelectField} value={dataObj.fontFamily || "Poppins"} onChange={e => updaterFn("fontFamily", e.target.value)}><option value="Montserrat">Montserrat</option><option value="Poppins">Poppins</option><option value="Arial">Arial</option><option value="Times New Roman">Serif</option></select>
        <input type="number" className={styles.builderTextInputField} placeholder="Size" value={dataObj.fontSize || 13} onChange={e => updaterFn("fontSize", Number(e.target.value))} />
        <select className={styles.builderSelectField} value={dataObj.fontWeight || "400"} onChange={e => updaterFn("fontWeight", e.target.value)}><option value="400">Normal (400)</option><option value="500">Medium (500)</option><option value="600">Semi-Bold (600)</option><option value="700">Bold (700)</option></select>
        <select className={styles.builderSelectField} value={dataObj.textTransform || "none"} onChange={e => updaterFn("textTransform", e.target.value)}><option value="none">Normal</option><option value="uppercase">UPPERCASE</option><option value="lowercase">lowercase</option><option value="capitalize">Capitalize</option></select>
        <select className={styles.builderSelectField} value={dataObj.textDecoration || "none"} onChange={e => updaterFn("textDecoration", e.target.value)}><option value="none">None</option><option value="underline">Underline</option><option value="line-through">Strikethrough</option></select>
        <input type="number" className={styles.builderTextInputField} placeholder="Line Height" step="0.1" value={dataObj.lineHeight || 1.5} onChange={e => updaterFn("lineHeight", Number(e.target.value))} />
        <input type="number" className={styles.builderTextInputField} placeholder="Letter Spacing" value={dataObj.letterSpacing || 0} onChange={e => updaterFn("letterSpacing", Number(e.target.value))} />
      </div>
    </div>
  );

  const activeWidget = tmplSections.flatMap(s => s.columns.flatMap(c => c.widgets)).find(w => w.widgetId === selectedWidgetId);
  const activeSelectedColumn = tmplSections.flatMap(s => s.columns.map(c => ({ ...c, sectionId: s.sectionId }))).find(c => c.columnId === selectedColumnId);
  const activeSelectedSection = tmplSections.find(s => s.sectionId === selectedSectionId);
  const filteredVariables = VARIABLE_DICTIONARY.filter(v => v.token.toLowerCase().includes(variableSearch.toLowerCase()) || v.description.toLowerCase().includes(variableSearch.toLowerCase()));

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
                <p>Drag elements straight into drop target zones or configure structural padding matrices</p>
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
                      onChange={(val) => setTmplProduct(val)} 
                    />
                  </div>

                  <div className={styles.formRowTwoColumnGrid}>
                    <div className={styles.controlGroupBlock}>
                      <label className={styles.controlMetaLabel}>Page Size Format</label>
                      <Dropdown 
                        options={[{ value: "a4", label: "DIN A4 Standard" }, { value: "letter", label: "US Letter Sheet" }, { value: "legal", label: "US Legal Size" }]} 
                        selected={tmplFormat} 
                        onChange={(val) => setTmplFormat(val)} 
                      />
                    </div>
                    <div className={styles.controlGroupBlock}>
                      <label className={styles.controlMetaLabel}>Page Orientation</label>
                      <Dropdown 
                        options={[{ value: "portrait", label: "Portrait Vertical" }, { value: "landscape", label: "Landscape Horiz" }]} 
                        selected={tmplOrientation} 
                        onChange={(val) => setTmplOrientation(val)} 
                      />
                    </div>
                  </div>

                  <div className={styles.themeCustomizationWidgetBoxContainer}>
                    <label className={styles.controlMetaLabel}>Global Token Colors Map</label>
                    <div className={styles.themeFormInputsDualGridInlineRow}>
                      <div className={styles.controlGroupBlock}><span className={styles.inlineColorLabelMini}>Brand Accent</span><input type="color" value={tmplTheme.primaryColor} onChange={(e) => setTmplTheme({ ...tmplTheme, primaryColor: e.target.value })} /></div>
                      <div className={styles.controlGroupBlock}><span className={styles.inlineColorLabelMini}>Font Text</span><input type="color" value={tmplTheme.textColor} onChange={(e) => setTmplTheme({ ...tmplTheme, textColor: e.target.value })} /></div>
                      <div className={styles.controlGroupBlock}><span className={styles.inlineColorLabelMini}>Sheet BG</span><input type="color" value={tmplTheme.backgroundColor} onChange={(e) => setTmplTheme({ ...tmplTheme, backgroundColor: e.target.value })} /></div>
                      <div className={styles.controlGroupBlock}><span className={styles.inlineColorLabelMini}>Grid Border</span><input type="color" value={tmplTheme.borderColor} onChange={(e) => setTmplTheme({ ...tmplTheme, borderColor: e.target.value })} /></div>
                    </div>
                  </div>

                  <button className={styles.layoutActionInjectBtnNode} onClick={() => handleAddSectionRow("standard")}><FiPlus /> Append Row Container</button>
                </>
              )}

              {activeSelectedSection && !selectedColumnId && !selectedWidgetId && (
                <div className={styles.inlineComponentSettingsEditorCard}>
                  <div className={styles.settingsCardHeaderBlockRow}><h6>Section Layer Attributes</h6><button className={styles.dismissSettingsBtn} onClick={() => setSelectedSectionId(null)}>&times;</button></div>
                  <div className={styles.inspectorTabsStrip}><button className={styles.tabActive}>Advanced Properties</button></div>
                  <div className={styles.controlGroupBlock} style={{marginTop: "12px"}}>
                    <label className={styles.controlMetaLabel}>Background Fill</label>
                    <input type="color" className={styles.colorInputElementNode} value={activeSelectedSection.style?.backgroundColor || "#ffffff"} onChange={(e) => handleUpdateSectionStyle(selectedSectionId, "backgroundColor", e.target.value)} />
                  </div>
                  {renderAdvancedInspector(activeSelectedSection.style, (k, v) => handleUpdateSectionStyle(selectedSectionId, k, v))}
                </div>
              )}

              {activeSelectedColumn && !activeWidget && (
                <div className={styles.sidebarColumnManagerBoxPanel}>
                  <div className={styles.sidebarColumnMetaLabelRow}><span>Active Grid Column Layout</span><button className={styles.dismissSettingsBtnMini} onClick={() => setSelectedColumnId(null)}>&times;</button></div>
                  <div className={styles.sidebarColumnSliderControlRow}>
                    <label>Flex Grid Width: {activeSelectedColumn.width}%</label>
                    <input type="range" min="10" max="100" value={activeSelectedColumn.width} onChange={(e) => handleResizeColumnWidth(activeSelectedColumn.sectionId, activeSelectedColumn.columnId, Number(e.target.value))} />
                  </div>
                  <button type="button" className={styles.sidebarDeleteColumnBtnLine} onClick={() => handleRemoveColumnFromSection(activeSelectedColumn.sectionId, activeSelectedColumn.columnId)}><FiTrash2 /> Remove Selected Column Node</button>
                  <div className={styles.inspectorTabsStrip} style={{marginTop: "16px"}}><button className={styles.tabActive}>Advanced Properties</button></div>
                  {renderAdvancedInspector(activeSelectedColumn.advanced, (k, v) => handleUpdateColumnStyle(activeSelectedColumn.sectionId, activeSelectedColumn.columnId, k, v))}
                </div>
              )}

              {activeWidget && (
                <div className={styles.inlineComponentSettingsEditorCard}>
                  <div className={styles.settingsCardHeaderBlockRow}><h6>{activeWidget.type.toUpperCase()} Node Property</h6><button className={styles.dismissSettingsBtn} onClick={() => setSelectedWidgetId(null)}>&times;</button></div>
                  <div className={styles.inspectorTabsStrip}>
                    <button className={inspectorTab === "content" ? styles.tabActive : ""} onClick={() => setInspectorTab("content")}>Content</button>
                    <button className={inspectorTab === "style" ? styles.tabActive : ""} onClick={() => setInspectorTab("style")}>Style</button>
                    <button className={inspectorTab === "advanced" ? styles.tabActive : ""} onClick={() => setInspectorTab("advanced")}>Advanced</button>
                  </div>

                  {inspectorTab === "advanced" && renderAdvancedInspector(activeWidget.advanced, (k, v) => handleUpdateWidgetAdvanced(activeWidget.widgetId, k, v))}

                  {inspectorTab === "content" && (
                    <div className={styles.inspectorTabBody}>
                      {(activeWidget.type === "header" || activeWidget.type === "subtitle") && (
                        <>
                          <div className={styles.controlGroupBlock}>
                            <label className={styles.controlMetaLabel}>HTML Element Tag</label>
                            <Dropdown 
                              options={[{ value: "h1", label: "Heading H1 Layer" }, { value: "h2", label: "Heading H2 Layer" }, { value: "h3", label: "Heading H3 Layer" }, { value: "h4", label: "Subheading H4" }, { value: "p", label: "Paragraph Standard" }]} 
                              selected={activeWidget.htmlTag || "h2"} 
                              onChange={(val) => handleUpdateWidgetField(activeWidget.widgetId, "htmlTag", val)} 
                            />
                          </div>
                          <div className={styles.controlGroupBlock}>
                            <label className={styles.controlMetaLabel}>Display Copy Text</label>
                            <textarea className={styles.builderTextareaInputField} rows={3} value={activeWidget.text || ""} onChange={(e) => handleUpdateWidgetField(activeWidget.widgetId, "text", e.target.value)} />
                          </div>
                        </>
                      )}

                      {activeWidget.type === "text" && (
                        <div className={styles.controlGroupBlock}>
                          <label className={styles.controlMetaLabel}>WYSIWYG Rich Editor Canvas</label>
                          <div className={styles.wysiwygToolbarActionButtonsStripRow}>
                            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execWysiwygCommand("bold")}><FiBold /></button>
                            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execWysiwygCommand("italic")}><FiItalic /></button>
                            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execWysiwygCommand("underline")}><FiUnderline /></button>
                          </div>
                          <div ref={wysiwygRef} className={styles.wysiwygContentEditableContainerBodyArea} contentEditable suppressContentEditableWarning onBlur={(e) => handleUpdateWidgetField(activeWidget.widgetId, "htmlContent", e.target.innerHTML)} dangerouslySetInnerHTML={{ __html: activeWidget.htmlContent }} />
                        </div>
                      )}

                      {activeWidget.type === "list" && (
                        <div className={styles.controlGroupBlock}>
                          <label className={styles.controlMetaLabel}>Multi-Line Record Lists Row Data</label>
                          <textarea className={styles.builderTextareaInputField} rows={4} value={activeWidget.text || ""} onChange={(e) => handleUpdateWidgetField(activeWidget.widgetId, "text", e.target.value)} />
                        </div>
                      )}

                      {activeWidget.type === "image" && (
                        <div className={styles.controlGroupBlock}>
                          <label className={styles.controlMetaLabel}>Source Image Resource URL Address</label>
                          <input type="text" className={styles.builderTextInputField} placeholder="https://domain.com/asset.png" value={activeWidget.imageUrl || ""} onChange={(e) => handleUpdateWidgetField(activeWidget.widgetId, "imageUrl", e.target.value)} />
                        </div>
                      )}

                      {activeWidget.type === "signoff" && (
                        <div className={styles.signoffInspectorFieldsStackPanel}>
                          <div className={styles.controlGroupBlock}><label className={styles.controlMetaLabel}>Signature Heading Label</label><input type="text" className={styles.builderTextInputField} value={activeWidget.text || ""} onChange={(e) => handleUpdateWidgetField(activeWidget.widgetId, "text", e.target.value)} /></div>
                          <div className={styles.controlGroupBlock}><label className={styles.controlMetaLabel}>Signatory Representative Legal Full Name</label><input type="text" className={styles.builderTextInputField} value={activeWidget.name || ""} onChange={(e) => handleUpdateWidgetField(activeWidget.widgetId, "name", e.target.value)} /></div>
                          <div className={styles.controlGroupBlock}><label className={styles.controlMetaLabel}>Signatory Official Designation Title Descriptor</label><input type="text" className={styles.builderTextInputField} value={activeWidget.title || ""} onChange={(e) => handleUpdateWidgetField(activeWidget.widgetId, "title", e.target.value)} /></div>
                          <div className={styles.controlGroupBlock}><label className={styles.controlMetaLabel}>Transparent E-Signature PNG Asset URL Path</label><input type="text" className={styles.builderTextInputField} value={activeWidget.signatureUrl || ""} onChange={(e) => handleUpdateWidgetField(activeWidget.widgetId, "signatureUrl", e.target.value)} /></div>
                          <div className={styles.controlGroupBlock}><label className={styles.controlMetaLabel}>Official Corporate Seal Stamp Validation Overlay URL</label><input type="text" className={styles.builderTextInputField} value={activeWidget.stampUrl || ""} onChange={(e) => handleUpdateWidgetField(activeWidget.widgetId, "stampUrl", e.target.value)} /></div>
                        </div>
                      )}
                    </div>
                  )}

                  {inspectorTab === "style" && (
                    <div className={styles.inspectorTabBody}>
                      {activeWidget.type !== "image" && activeWidget.type !== "table" && (
                        <div className={styles.formRowTwoColumnGrid}>
                          <div className={styles.controlGroupBlock}>
                            <label className={styles.controlMetaLabel}>Font Hex Color</label>
                            <input type="color" className={styles.colorInputElementNode} value={activeWidget.textColor || "#202223"} onChange={(e) => handleUpdateWidgetField(activeWidget.widgetId, "textColor", e.target.value)} />
                          </div>
                          <div className={styles.controlGroupBlock}>
                            <label className={styles.controlMetaLabel}>Aesthetic Alignment</label>
                            <Dropdown 
                              options={[{ value: "left", label: "Left Alignment" }, { value: "center", label: "Centered Axis" }, { value: "right", label: "Right Alignment" }]} 
                              selected={activeWidget.textAlign || activeWidget.alignment || "left"} 
                              onChange={(val) => handleUpdateWidgetField(activeWidget.widgetId, activeWidget.type === "signoff" ? "alignment" : "textAlign", val)} 
                            />
                          </div>
                        </div>
                      )}

                      {(activeWidget.type === "header" || activeWidget.type === "subtitle") && (
                        <div className={styles.formRowTwoColumnGrid}>
                          <div className={styles.controlGroupBlock}><label className={styles.controlMetaLabel}>Size em/px</label><input type="number" className={styles.builderTextInputField} value={activeWidget.fontSize || 14} onChange={(e) => handleUpdateWidgetField(activeWidget.widgetId, "fontSize", Number(e.target.value))} /></div>
                          <div className={styles.controlGroupBlock}>
                            <label className={styles.controlMetaLabel}>Font Weights</label>
                            <Dropdown 
                              options={[{ value: "400", label: "Regular Weight" }, { value: "600", label: "Semi Bold" }, { value: "700", label: "Bold Weight" }]} 
                              selected={String(activeWidget.fontWeight || "400")} 
                              onChange={(val) => handleUpdateWidgetField(activeWidget.widgetId, "fontWeight", val)} 
                            />
                          </div>
                        </div>
                      )}

                      {activeWidget.type === "header" || activeWidget.type === "subtitle" || activeWidget.type === "text" || activeWidget.type === "list" || activeWidget.type === "metadata" || activeWidget.type === "signoff" ? (
                        renderTypographyInspector(activeWidget, (k, v) => handleUpdateWidgetField(activeWidget.widgetId, k, v))
                      ) : null}

                      {activeWidget.type === "list" && (
                        <div className={styles.listSpecificControlsStackPanel}>
                          <div className={styles.controlGroupBlock}>
                            <label className={styles.controlMetaLabel}>Vector Marker Protocol</label>
                            <Dropdown 
                              options={[{ value: "bullet", label: "Circular Dots Layer" }, { value: "number", label: "Sequential Numeric" }, { value: "icon", label: "Custom Validation ✓ Icons" }]} 
                              selected={activeWidget.listType || "bullet"} 
                              onChange={(val) => handleUpdateWidgetField(activeWidget.widgetId, "listType", val)} 
                            />
                          </div>
                        </div>
                      )}

                      {activeWidget.type === "table" && (
                        <div className={styles.tablePropertyInspectorStackDeck}>
                          <div className={styles.formRowTwoColumnGrid}>
                            <div className={styles.controlGroupBlock}><label className={styles.controlMetaLabel}>Header Pad</label><input type="number" className={styles.builderTextInputField} value={activeWidget.headerPadding || 10} onChange={(e) => handleUpdateWidgetField(activeWidget.widgetId, "headerPadding", Number(e.target.value))} /></div>
                            <div className={styles.controlGroupBlock}><label className={styles.controlMetaLabel}>Cell Gutter Pad</label><input type="number" className={styles.builderTextInputField} value={activeWidget.contentPadding || 12} onChange={(e) => handleUpdateWidgetField(activeWidget.widgetId, "contentPadding", Number(e.target.value))} /></div>
                          </div>
                          <div className={styles.formRowTwoColumnGrid}>
                            <div className={styles.controlGroupBlock}>
                              <label className={styles.controlMetaLabel}>Header Alignment</label>
                              <Dropdown 
                                options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} 
                                selected={activeWidget.headerAlign || "center"} 
                                onChange={(val) => handleUpdateWidgetField(activeWidget.widgetId, "headerAlign", val)} 
                              />
                            </div>
                            <div className={styles.controlGroupBlock}>
                              <label className={styles.controlMetaLabel}>Content Alignment</label>
                              <Dropdown 
                                options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} 
                                selected={activeWidget.contentAlign || "left"} 
                                onChange={(val) => handleUpdateWidgetField(activeWidget.widgetId, "contentAlign", val)} 
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedColumnId && !selectedWidgetId && (
                <div className={styles.componentAssetLibraryCardTrayBlock}>
                  <label className={styles.controlMetaLabel}>Components Deck Shelf</label>
                  <div className={styles.componentAssetIconsGridMatrixItemsStack}>
                    {[
                      { type: "header", label: "Title Banner", icon: FiType },
                      { type: "subtitle", label: "Section Label", icon: FiSliders },
                      { type: "text", label: "Paragraph Doc", icon: FiFileText },
                      { type: "list", label: "Lists Engine", icon: FiList },
                      { type: "image", label: "Branding Box", icon: FiImage },
                      { type: "video", label: "Media Stream", icon: FiVideo },
                      { type: "table", label: "Items Matrix", icon: FiGrid },
                      { type: "metadata", label: "Variables Card", icon: FiCode },
                      { type: "signoff", label: "Legal Stamp", icon: FiCheck }
                    ].map(asset => {
                      const Icon = asset.icon;
                      return (
                        <button key={asset.type} onClick={() => handleAddWidgetToColumn(selectedSectionId, selectedColumnId, asset.type)} draggable onDragStart={e => { e.dataTransfer.setData("new_widget", asset.type); setIsDragging(true); }} onDragEnd={() => setIsDragging(false)}>
                          <Icon /> <span>{asset.label}</span>
                        </button>
                      );
                    })}
                  </div>
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
                  {tmplSections.map((sec) => (
                    <div 
                      key={sec.sectionId} 
                      className={`${styles.renderedCanvasSectionRow} ${selectedSectionId === sec.sectionId ? styles.sectionRowActiveSelected : ""}`}
                      style={buildAdvancedStyles(sec.style)}
                      onClick={(e) => { e.stopPropagation(); setSelectedSectionId(sec.sectionId); setSelectedColumnId(null); setSelectedWidgetId(null); }}
                    >
                      <div className={styles.sectionRowActionFloatingOverlay}>
                        <button className={styles.actionBtnMiniPurge} onClick={(e) => { e.stopPropagation(); handleRemoveSectionRow(sec.sectionId); }}>&times;</button>
                        <button className={styles.actionBtnMiniAdd} onClick={(e) => { e.stopPropagation(); handleAddColumnToSection(sec.sectionId); }}>+ Grid Col</button>
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
                                 const moveData = JSON.parse(moveDataStr);
                                 handleMoveWidgetAcrossColumns(moveData.sectionId, moveData.columnId, moveData.widgetId, sec.sectionId, col.columnId);
                              }
                            }}
                          >
                            <div className={styles.columnWidgetsVerticalStackList}>
                              {col.widgets.map((widget) => {
                                const isSelected = selectedWidgetId === widget.widgetId;
                                const tStyles = buildTypographyStyles(widget);
                                return (
                                  <div 
                                    key={widget.widgetId}
                                    draggable
                                    onDragStart={(e) => { e.dataTransfer.setData("move_widget", JSON.stringify({ sectionId: sec.sectionId, columnId: col.columnId, widgetId: widget.widgetId })); setIsDragging(true); e.stopPropagation(); }}
                                    onDragEnd={() => setIsDragging(false)}
                                    className={`${styles.canvasWidgetRenderLeafNode} ${isSelected ? styles.widgetLeafActiveSelected : ""}`}
                                    style={buildAdvancedStyles(widget.advanced)}
                                    onClick={(e) => { e.stopPropagation(); setSelectedSectionId(sec.sectionId); setSelectedColumnId(col.columnId); setSelectedWidgetId(widget.widgetId); setInspectorTab("content"); }}
                                  >
                                    {isSelected && (
                                      <div className={styles.widgetOverlayToolbarTopRight}>
                                        <button className={styles.widgetPurgeMiniBtnFloating} onClick={(e) => { e.stopPropagation(); handleRemoveWidget(widget.widgetId); }}>&times;</button>
                                        <span className={styles.widgetDragHandleIndicator}><FiMove /></span>
                                      </div>
                                    )}

                                    {widget.type === "header" && (
                                      <h2 className={styles.renderedHeaderTitleNode} style={{ ...tStyles, textAlign: widget.textAlign || "center" }}>
                                        {parseTemplateVariables(widget.text)}
                                      </h2>
                                    )}

                                    {widget.type === "subtitle" && (
                                      <h4 className={styles.renderedSubtitleNode} style={{ ...tStyles, textAlign: widget.textAlign || "left" }}>
                                        {parseTemplateVariables(widget.text)}
                                      </h4>
                                    )}

                                    {widget.type === "text" && (
                                      <div className={styles.renderedParagraphBodyText} style={{ ...tStyles, textAlign: widget.textAlign || "left" }} dangerouslySetInnerHTML={{ __html: parseTemplateVariables(widget.htmlContent) }} />
                                    )}

                                    {widget.type === "list" && (
                                      <div className={styles.renderedListWrapperEngine} style={tStyles}>
                                        <ul className={styles.pdfTemplateUnorderedListBlock} style={{ gap: `${widget.itemSpacing || 6}px` }}>
                                          {(widget.text || "").split("\n").map((item, idx) => item.trim() && (
                                            <li key={idx} className={styles.customIconBulletLineItem}>
                                              <span style={{ color: widget.markerColor || tmplTheme.primaryColor, marginRight: `${widget.iconSpacing || 8}px` }}>✓</span>
                                              {parseTemplateVariables(item)}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {widget.type === "image" && (
                                      <div style={{ display: "flex", justifyContent: widget.alignment || "center" }}>
                                        <img src={widget.imageUrl || "https://via.placeholder.com/150x50.png?text=Branding+Asset"} style={{ width: widget.widthMode === "%" ? `${widget.widthValue || 30}%` : `${widget.widthValue || 150}px`, opacity: widget.opacity || 1, objectFit: widget.objectFit || "contain" }} alt="Canvas Graphic Node" />
                                      </div>
                                    )}

                                    {widget.type === "video" && (
                                      <div style={{ width: `${widget.widthValue || 100}%`, background: "#1e1e1e", padding: 20, textAlign: "center", color: "#fff", borderRadius: 6, margin: "0 auto" }}><FiVideo size={24} color="#E21F26" /><div style={{ fontSize: 10, marginTop: 8 }}>{widget.videoUrl || "Video Link Placeholder"}</div></div>
                                    )}

                                    {widget.type === "table" && (
                                      <table width="100%" className={styles.canvasRenderedInvoiceItemsGridTable} style={{ ...tStyles, borderColor: widget.borderColor || tmplTheme.borderColor }}>
                                        <thead>
                                          <tr style={{ backgroundColor: widget.headerBg || "#fafafa", color: widget.headerText || "#6d7175" }}>
                                            <th style={{ textAlign: widget.headerAlign || "left", padding: `${widget.headerPadding || 10}px` }}>Sync catalog description item</th>
                                            <th style={{ textAlign: "center", padding: `${widget.headerPadding || 10}px`, width: "60px" }}>Qty</th>
                                            <th style={{ textAlign: "right", padding: `${widget.headerPadding || 10}px`, width: "120px" }}>Net Value</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          <tr>
                                            <td style={{ padding: `${widget.contentPadding || 12}px` }}>Standard Smart Home IoT Sensor Node Override Layout Module</td>
                                            <td style={{ textAlign: "center", padding: `${widget.contentPadding || 12}px` }}>1</td>
                                            <td style={{ textAlign: "right", padding: `${widget.contentPadding || 12}px`, fontWeight: "600" }}>₹45,000.00</td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    )}

                                    {widget.type === "metadata" && (
                                      <div className={styles.renderedMetadataPanelBoxGrid} style={{ ...tStyles, backgroundColor: widget.backgroundColor || "#fafbfc", borderColor: widget.borderColor || tmplTheme.borderColor }}>
                                        {(widget.text || "Key: Value").split("\n").map((line, idx) => {
                                          const tokens = line.split(":");
                                          return (
                                            <div key={idx} className={styles.metadataPanelBoxStringLine}>
                                              <span style={{ color: widget.labelColor || "#6d7175", fontWeight: "600" }}>{tokens[0]}:</span>
                                              <span>{parseTemplateVariables(tokens.slice(1).join(":"))}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {widget.type === "signoff" && (
                                      <div className={styles.renderedCorporateSignoffStripZone} style={{ ...tStyles, marginTop: `${widget.marginTop || 40}px`, textAlign: widget.alignment || "right" }}>
                                        <div style={{ display: "inline-block", borderTop: `${widget.lineWidth || 1}px ${widget.lineStyle || "solid"} ${widget.lineColor || "#202223"}`, paddingTop: "8px", minWidth: "200px" }}>
                                          <div style={{ fontStyle: "italic", fontSize: "11px", color: widget.textColor || "#6d7175", marginBottom: "4px" }}>{widget.text}</div>
                                          <div style={{ fontWeight: "700" }}>{widget.name}</div>
                                          <div style={{ fontSize: "12px" }}>{widget.title}</div>
                                        </div>
                                      </div>
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
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}