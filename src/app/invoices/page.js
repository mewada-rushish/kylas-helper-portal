"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FiPlus, FiTrash2, FiEye, FiEdit2, FiLayout, FiInbox, FiArrowLeft, FiCheck, 
  FiChevronUp, FiChevronDown, FiPrinter, FiFileText, FiSliders, FiVideo, 
  FiList, FiImage, FiGrid, FiCode, FiType, FiSearch, FiSettings, FiMove
} from "react-icons/fi";
import Sidebar from "@/components/layout/sidebar/sidebar";
import AdminButton from "@/components/ui/button/button";
import Dropdown from "@/components/ui/dropdown/dropdown";
import styles from "./invoices.module.css";

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

const DEFAULT_SECTION_STYLE = { backgroundColor: "transparent", backgroundImage: "", paddingTop: "0px", paddingBottom: "0px" };

const INITIAL_DEFAULT_LAYOUT = [
  {
    sectionId: "sec_header",
    type: "header",
    style: { ...DEFAULT_SECTION_STYLE, backgroundColor: "#27347B", paddingBottom: "10px", paddingTop: "10px" },
    columns: [
      {
        columnId: "col_h1",
        width: 100,
        widgets: [
          { widgetId: "w_h1", type: "header", text: "TAX INVOICE STATEMENT", bold: true, italic: false }
        ]
      }
    ]
  },
  {
    sectionId: "sec_body",
    type: "standard",
    style: { ...DEFAULT_SECTION_STYLE, paddingTop: "20px" },
    columns: [
      {
        columnId: "col_b1",
        width: 60,
        widgets: [
          { widgetId: "w_t1", type: "subtitle", text: "Billed To Account:" },
          { widgetId: "w_t2", type: "text", text: "{{customer.name}}\nEmail: {{customer.email}}", bold: false, italic: false }
        ]
      },
      {
        columnId: "col_b2",
        width: 40,
        widgets: [
          { widgetId: "w_m1", type: "metadata", text: "Invoice Ref: {{invoice.id}}\nDate: {{current.date}}" }
        ]
      }
    ]
  },
  {
    sectionId: "sec_table",
    type: "standard",
    style: { ...DEFAULT_SECTION_STYLE, paddingTop: "10px", paddingBottom: "10px" },
    columns: [
      {
        columnId: "col_t1",
        width: 100,
        widgets: [
          { widgetId: "w_tbl1", type: "table" }
        ]
      }
    ]
  },
  {
    sectionId: "sec_terms",
    type: "standard",
    style: { ...DEFAULT_SECTION_STYLE },
    columns: [
      {
        columnId: "col_tr1",
        width: 100,
        widgets: [
          { widgetId: "w_tr_txt", type: "text", text: "Payment Terms & Conditions:\nNet 30. Please settle outstanding balances using centralized BBPS transaction channels securely.", bold: false, italic: true }
        ]
      }
    ]
  },
  {
    sectionId: "sec_footer",
    type: "footer",
    style: { ...DEFAULT_SECTION_STYLE, backgroundColor: "#fafafa", paddingTop: "20px", paddingBottom: "20px" },
    columns: [
      {
        columnId: "col_f1",
        width: 100,
        widgets: [
          { widgetId: "w_f1", type: "footer", text: "Thank you for partnering with AsmitA Operations Portal Core Network.\nSystem dispatched document. No physical signature required baseline." }
        ]
      }
    ]
  }
];

const INITIAL_TEMPLATES = [
  { 
    id: "tmpl_default", 
    name: "Standard PDF Layout Master", 
    isDefault: true, 
    attachedProductId: null,
    theme: { primaryColor: "#27347B", textColor: "#202223", backgroundColor: "#ffffff", borderColor: "#e1e3e5" },
    sections: INITIAL_DEFAULT_LAYOUT
  }
];

const INITIAL_INVOICES = [
  { id: "INV-2026-001", customer: "Acme Corporate Entity", email: "finance@acme.com", date: "2026-06-18", productId: "prod_crm_ent", qty: 2, rate: 45000, total: 106200 },
  { id: "INV-2026-002", customer: "Society Hub Operations", email: "accounts@societyhub.in", date: "2026-06-19", productId: "prod_iot_node", qty: 10, rate: 3500, total: 100300 }
];

export default function UnifiedInvoiceERPManagement() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState("invoices"); 
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [invoiceModalMode, setInvoiceModalOpen] = useState(null); 
  const [templatePreviewModalOpen, setTemplatePreviewModalOpen] = useState(false);

  const [invCustomer, setInvCustomer] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invProduct, setInvProduct] = useState("prod_crm_ent");
  const [invQty, setInvQty] = useState(1);
  const [invRate, setInvRate] = useState(0);

  const [tmplName, setTmplName] = useState("");
  const [tmplProduct, setTmplProduct] = useState("none");
  const [tmplSections, setTmplSections] = useState([]);
  const [tmplTheme, setTmplTheme] = useState({ primaryColor: "#27347B", textColor: "#202223", backgroundColor: "#ffffff", borderColor: "#e1e3e5" });
  
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState(null);
  
  const [autoSaveBadge, setAutoSaveBadge] = useState("All changes saved");
  const [isDragging, setIsDragging] = useState(false);
  const [variableSearch, setVariableSearch] = useState("");

  useEffect(() => {
    if (viewMode !== "builder" || !activeTemplate) return;
    
    setAutoSaveBadge("Autosaving layout architecture...");
    const saveTimer = setTimeout(() => {
      const mappedProductId = tmplProduct === "none" ? null : tmplProduct;
      
      setTemplates(prevTemplates => {
        let cleanTemplates = prevTemplates;
        if (mappedProductId) {
          cleanTemplates = cleanTemplates.map(t => 
            t.attachedProductId === mappedProductId && t.id !== activeTemplate.id 
              ? { ...t, attachedProductId: null } 
              : t
          );
        }
        return cleanTemplates.map(t => t.id === activeTemplate.id ? {
          ...t,
          name: tmplName,
          attachedProductId: mappedProductId,
          theme: tmplTheme,
          sections: tmplSections
        } : t);
      });
      
      setAutoSaveBadge("Layout state autosaved");
    }, 1200);

    return () => clearTimeout(saveTimer);
  }, [tmplName, tmplProduct, tmplSections, tmplTheme, viewMode]);

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
      console.error("Fallback clipboard copy implementation failed", err);
    }
    document.body.removeChild(textArea);
  };

  const handleOpenInvoiceModal = (mode, invoice = null) => {
    setInvoiceModalOpen(mode);
    if (invoice) {
      setActiveInvoice(invoice);
      setInvCustomer(invoice.customer);
      setInvEmail(invoice.email);
      setInvProduct(invoice.productId);
      setInvQty(invoice.qty);
      setInvRate(invoice.rate);
    } else {
      setActiveInvoice(null);
      setInvCustomer("");
      setInvEmail("");
      setInvProduct("prod_crm_ent");
      setInvQty(1);
      setInvRate(0);
    }
  };

  const handleSaveInvoice = (e) => {
    e.preventDefault();
    const qtyNum = Number(invQty);
    const rateNum = Number(invRate);
    const calculatedTotal = (qtyNum * rateNum) * 1.18; 

    if (invoiceModalMode === "create") {
      const newInv = {
        id: `INV-2026-00${invoices.length + 1}`,
        customer: invCustomer,
        email: invEmail,
        date: new Date().toISOString().split("T")[0],
        productId: invProduct,
        qty: qtyNum,
        rate: rateNum,
        total: calculatedTotal
      };
      setInvoices([newInv, ...invoices]);
    } else if (invoiceModalMode === "edit" && activeInvoice) {
      setInvoices(invoices.map(inv => inv.id === activeInvoice.id ? {
        ...inv,
        customer: invCustomer,
        email: invEmail,
        productId: invProduct,
        qty: qtyNum,
        rate: rateNum,
        total: calculatedTotal
      } : inv));
    }
    setInvoiceModalOpen(null);
  };

  const handleOpenTemplateBuilder = (template = null) => {
    if (template) {
      setActiveTemplate(template);
      setTmplName(template.name);
      setTmplProduct(template.attachedProductId || "none");
      setTmplSections(template.sections);
      setTmplTheme(template.theme);
    } else {
      const newId = `tmpl_${Date.now()}`;
      const placeholderTmpl = {
        id: newId,
        name: "Custom Matrix PDF Template Layout",
        isDefault: false,
        attachedProductId: null,
        theme: { primaryColor: "#27347B", textColor: "#202223", backgroundColor: "#ffffff", borderColor: "#e1e3e5" },
        sections: JSON.parse(JSON.stringify(INITIAL_DEFAULT_LAYOUT))
      };
      setTemplates([...templates, placeholderTmpl]);
      setActiveTemplate(placeholderTmpl);
      setTmplName(placeholderTmpl.name);
      setTmplProduct("none");
      setTmplSections(placeholderTmpl.sections);
      setTmplTheme(placeholderTmpl.theme);
    }
    setSelectedSectionId(null);
    setSelectedColumnId(null);
    setSelectedWidgetId(null);
    setViewMode("builder");
  };

  // RESTORED PREVIEW FUNCTION
  const handleOpenTemplatePreview = (template) => {
    setActiveTemplate(template);
    setTemplatePreviewModalOpen(true);
  };

  const handleAddSectionRow = (type = "standard") => {
    const newSection = {
      sectionId: `sec_${Date.now()}`,
      type,
      style: { ...DEFAULT_SECTION_STYLE },
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
      sec.sectionId === sectionId 
        ? { ...sec, style: { ...sec.style, [key]: value } }
        : sec
    ));
  };

  const handleAddColumnToSection = (sectionId) => {
    setTmplSections(tmplSections.map(sec => {
      if (sec.sectionId !== sectionId) return sec;
      const colCount = sec.columns.length + 1;
      if (colCount > 4) return sec; 
      
      const equalWidth = Math.floor(100 / colCount);
      const updatedColumns = [...sec.columns, { columnId: `col_${Date.now()}`, width: equalWidth, widgets: [] }];
      return {
        ...sec,
        columns: updatedColumns.map(c => ({ ...c, width: equalWidth }))
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

      if (targetCol.width - diff < 10) return sec; 

      const newColumns = [...sec.columns];
      newColumns[colIdx] = { ...newColumns[colIdx], width: nextWidth };
      newColumns[targetIdx] = { ...newColumns[targetIdx], width: targetCol.width - diff };

      return { ...sec, columns: newColumns };
    }));
  };

  const handleAddWidgetToColumn = (sectionId, columnId, widgetType) => {
    const baselineConfigs = {
      header: { text: "INVOICE DISPATCH", bold: true, italic: false },
      subtitle: { text: "Document Subheading Context Row", bold: true, italic: false },
      text: { text: "Add pre-formatted text string or policy statements.", bold: false, italic: false },
      list: { text: "First Item Leaf Row\nSecond Sequenced Row Element", listType: "bullet" },
      image: { imageUrl: "https://via.placeholder.com/150x50.png?text=Logo+Space" },
      video: { videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      table: {},
      metadata: { text: "Variable Node Key: Value\nCompiled Mapping Code: Context" },
      signoff: { text: "Authorized Sign-off Strip Block" }
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
        columns: sec.columns.map(col => col.columnId === columnId ? {
          ...col,
          widgets: [...col.widgets, newWidget]
        } : col)
      };
    }));
    setSelectedWidgetId(newWidget.widgetId);
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

  const handleUpdateWidgetField = (widgetId, key, value) => {
    setTmplSections(tmplSections.map(sec => ({
      ...sec,
      columns: sec.columns.map(col => ({
        ...col,
        widgets: col.widgets.map(w => w.widgetId === widgetId ? { ...w, [key]: value } : w)
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

  const parseTemplateVariables = (rawString, invoiceContext = null) => {
    if (!rawString) return "";
    const ctx = invoiceContext || {
      id: "INV-DEMO-99",
      customer: "Alpha Society Test Corp",
      email: "finance@alphacorp.in",
      productId: "prod_crm_ent",
      qty: 1,
      rate: 45000,
      total: 53100,
      date: new Date().toISOString().split("T")[0]
    };
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

  const renderDocumentCanvasSections = (sectionsList, themeObj, invoiceContext = null) => {
    return (
      <div className={styles.pdfInvoiceLayoutContainerMock} style={{ backgroundColor: themeObj.backgroundColor, color: themeObj.textColor }}>
        {sectionsList.map((sec) => {
          const secStyle = sec.style || DEFAULT_SECTION_STYLE;
          return (
            <div 
              key={sec.sectionId} 
              className={`${styles.renderedCanvasSectionRow} ${viewMode === "builder" && selectedSectionId === sec.sectionId ? styles.sectionRowActiveSelected : ""}`}
              style={{
                backgroundColor: secStyle.backgroundColor || "transparent",
                backgroundImage: secStyle.backgroundImage ? `url(${secStyle.backgroundImage})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                paddingTop: secStyle.paddingTop || "0px",
                paddingBottom: secStyle.paddingBottom || "0px",
              }}
              onClick={(e) => { 
                e.stopPropagation(); 
                if(viewMode === "builder") {
                  setSelectedSectionId(sec.sectionId);
                  setSelectedColumnId(null);
                  setSelectedWidgetId(null);
                }
              }}
            >
              {viewMode === "builder" && (
                <div className={styles.sectionRowActionFloatingOverlay}>
                  <button className={styles.actionBtnMiniPurge} onClick={(e) => { e.stopPropagation(); handleRemoveSectionRow(sec.sectionId); }} title="Delete Section Layer">&times;</button>
                  <button className={styles.actionBtnMiniAdd} onClick={(e) => { e.stopPropagation(); handleAddColumnToSection(sec.sectionId); }} title="Split Row into Additional Grid Column">+ Grid Col</button>
                </div>
              )}

              <div className={styles.flexGridColumnsContainerRow}>
                {sec.columns.map((col) => (
                  <div 
                    key={col.columnId} 
                    className={`${styles.renderedCanvasColumnNode} ${viewMode === "builder" && selectedColumnId === col.columnId ? styles.columnNodeActiveSelected : ""} ${isDragging ? styles.dropZoneCandidateHighlight : ""}`}
                    style={{ flex: `0 0 ${col.width}%`, width: `${col.width}%`, borderColor: themeObj.borderColor }}
                    onClick={(e) => { e.stopPropagation(); if(viewMode === "builder") { setSelectedSectionId(sec.sectionId); setSelectedColumnId(col.columnId); setSelectedWidgetId(null); } }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                      const newWidgetType = e.dataTransfer.getData("new_widget");
                      if (newWidgetType) {
                        handleAddWidgetToColumn(sec.sectionId, col.columnId, newWidgetType);
                        return;
                      }
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
                        return (
                          <div 
                            key={widget.widgetId}
                            draggable={viewMode === "builder"}
                            onDragStart={(e) => {
                              e.dataTransfer.setData("move_widget", JSON.stringify({ sectionId: sec.sectionId, columnId: col.columnId, widgetId: widget.widgetId }));
                              setIsDragging(true);
                              e.stopPropagation();
                            }}
                            onDragEnd={() => setIsDragging(false)}
                            className={`${styles.canvasWidgetRenderLeafNode} ${viewMode === "builder" && isSelected ? styles.widgetLeafActiveSelected : ""}`}
                            onClick={(e) => { e.stopPropagation(); if(viewMode === "builder") { setSelectedSectionId(sec.sectionId); setSelectedColumnId(col.columnId); setSelectedWidgetId(widget.widgetId); } }}
                          >
                            {viewMode === "builder" && isSelected && (
                              <div className={styles.widgetOverlayToolbarTopRight}>
                                <button className={styles.widgetPurgeMiniBtnFloating} onClick={(e) => { e.stopPropagation(); handleRemoveWidget(widget.widgetId); }} title="Remove Component">&times;</button>
                                <span className={styles.widgetDragHandleIndicator} title="Drag to move"><FiMove /></span>
                              </div>
                            )}

                            {widget.type === "header" && (
                              <h2 className={styles.renderedHeaderTitleNode} style={{ color: themeObj.primaryColor }}>
                                {parseTemplateVariables(widget.text, invoiceContext) || "TAX INVOICE RECORD"}
                              </h2>
                            )}

                            {widget.type === "subtitle" && (
                              <h4 className={styles.renderedSubtitleNode}>
                                {parseTemplateVariables(widget.text, invoiceContext) || "Section Group Heading Context"}
                              </h4>
                            )}

                            {widget.type === "text" && (
                              <p 
                                className={styles.renderedParagraphBodyText}
                                style={{ 
                                  fontWeight: widget.bold ? "700" : "400", 
                                  fontStyle: widget.italic ? "italic" : "normal" 
                                }}
                              >
                                {parseTemplateVariables(widget.text, invoiceContext) || "Standard pre-formatted structural typography block segment goes here."}
                              </p>
                            )}

                            {widget.type === "list" && (
                              <div className={styles.renderedListWrapperEngine}>
                                {widget.listType === "number" ? (
                                  <ol className={styles.pdfTemplateOrderedListBlock}>
                                    {(widget.text || "").split("\n").map((item, idx) => item.trim() && (
                                      <li key={idx}>{parseTemplateVariables(item, invoiceContext)}</li>
                                    ))}
                                  </ol>
                                ) : (
                                  <ul className={styles.pdfTemplateUnorderedListBlock}>
                                    {(widget.text || "").split("\n").map((item, idx) => item.trim() && (
                                      <li key={idx} className={widget.listType === "icon" ? styles.customIconBulletLineItem : ""}>
                                        {parseTemplateVariables(item, invoiceContext)}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}

                            {widget.type === "image" && (
                              <div className={styles.renderedImageBlockWrapperContainer}>
                                <img src={widget.imageUrl || "https://via.placeholder.com/150x50.png?text=Corporate+Identity+Logo"} alt="Invoice Branding Asset Component" />
                              </div>
                            )}

                            {widget.type === "video" && (
                              <div className={styles.renderedEmbeddedVideoSimCard}>
                                <div className={styles.videoMockPlayerViewport}>
                                  <FiVideo className={styles.videoPlayerGraphicIconMesh} />
                                  <span className={styles.videoMockUrlRouteLabelSubtext}>{widget.videoUrl || "https://youtube.com/vimeo-embed-stream"}</span>
                                </div>
                              </div>
                            )}

                            {widget.type === "table" && (() => {
                              const ctx = invoiceContext || { id: "INV-99", customer: "Demo Entity", email: "demo@test.com", productId: "prod_crm_ent", qty: 1, rate: 25000, total: 29500 };
                              const targetProductObj = KYLAS_PRODUCTS.find(p => p.value === ctx.productId);
                              const lineSubtotal = ctx.qty * ctx.rate;
                              const taxVal = lineSubtotal * 0.18;
                              return (
                                <table width="100%" className={styles.canvasRenderedInvoiceItemsGridTable} style={{ borderColor: themeObj.borderColor }}>
                                  <thead>
                                    <tr style={{ backgroundColor: "#fafafa" }}>
                                      <th style={{ borderColor: themeObj.borderColor }}>Kylas Sync Catalog Item</th>
                                      <th align="center" style={{ borderColor: themeObj.borderColor, width: "60px" }}>Qty</th>
                                      <th align="right" style={{ borderColor: themeObj.borderColor, width: "100px" }}>Unit Rate</th>
                                      <th align="right" style={{ borderColor: themeObj.borderColor, width: "110px" }}>Tax (18%)</th>
                                      <th align="right" style={{ borderColor: themeObj.borderColor, width: "120px" }}>Net Value</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td style={{ borderColor: themeObj.borderColor }}>{targetProductObj?.label || ctx.productId}</td>
                                      <td align="center" style={{ borderColor: themeObj.borderColor }}>{ctx.qty}</td>
                                      <td align="right" style={{ borderColor: themeObj.borderColor }}>₹{ctx.rate.toLocaleString("en-IN")}.00</td>
                                      <td align="right" style={{ borderColor: themeObj.borderColor }}>₹{taxVal.toLocaleString("en-IN")}.00</td>
                                      <td align="right" style={{ borderColor: themeObj.borderColor, fontWeight: "600" }}>₹{ctx.total.toLocaleString("en-IN")}.00</td>
                                    </tr>
                                  </tbody>
                                </table>
                              );
                            })()}

                            {widget.type === "metadata" && (
                              <div className={styles.renderedMetadataPanelBoxGrid} style={{ borderColor: themeObj.borderColor }}>
                                { (widget.text || "").split("\n").map((line, idx) => (
                                  <div key={idx} className={styles.metadataPanelBoxStringLine}>{parseTemplateVariables(line, invoiceContext)}</div>
                                )) }
                              </div>
                            )}

                            {widget.type === "signoff" && (
                              <div className={styles.renderedCorporateSignoffStripZone}>
                                <div className={styles.signoffLineDelimiterBoxField} style={{ borderColor: themeObj.borderColor }}>
                                  <span>{parseTemplateVariables(widget.text, invoiceContext) || "Authorized Corporate Registry Seal Sign-off"}</span>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const selectedWidgetInstance = tmplSections
    .flatMap(s => s.columns.flatMap(c => c.widgets))
    .find(w => w.widgetId === selectedWidgetId);

  const activeSelectedColumn = tmplSections
    .flatMap(s => s.columns.map(c => ({ ...c, sectionId: s.sectionId })))
    .find(c => c.columnId === selectedColumnId);
    
  const activeSelectedSection = tmplSections.find(s => s.sectionId === selectedSectionId);

  const filteredVariables = VARIABLE_DICTIONARY.filter(v => 
    v.token.toLowerCase().includes(variableSearch.toLowerCase()) || 
    v.description.toLowerCase().includes(variableSearch.toLowerCase())
  );

  return (
    <div className={styles.adminLayout}>
      <Sidebar activeId="invoices" />

      <main className={styles.mainCanvas}>
        <div className={styles.pageMaxWidth}>
          
          <header className={styles.pageHeader}>
            <div className={styles.headerLeftBlock}>
              {viewMode !== "invoices" && (
                <button 
                  className={styles.backButton} 
                  onClick={() => setViewMode(viewMode === "builder" ? "templates" : "invoices")} 
                  title={viewMode === "builder" ? "Return to Templates Directory" : "Return to Invoices Ledger"}
                >
                  <FiArrowLeft />
                </button>
              )}
              <div className={styles.headerTitle}>
                {viewMode === "invoices" && (
                  <>
                    <h1>Generated Invoices</h1>
                    <p>Track parameter-mapped operations billing ledger records synchronized downstream</p>
                  </>
                )}
                {viewMode === "templates" && (
                  <>
                    <h1>Invoice PDF Layout Templates</h1>
                    <p>Design multi-column templates or register precise product context layout overrides</p>
                  </>
                )}
                {viewMode === "builder" && (
                  <>
                    <div className={styles.builderTitleFlexRow}>
                      <h1>PDF Section Blueprint Studio</h1>
                      <span className={styles.autoSaveStatusBadge}>{autoSaveBadge}</span>
                    </div>
                    <p>Assemble layout nodes. Drag assets directly or click to place them on the document preview frame canvas</p>
                  </>
                )}
              </div>
            </div>
            
            <div className={styles.headerActions}>
              {viewMode === "invoices" && (
                <>
                  <AdminButton variant="secondary" icon={FiLayout} onClick={() => setViewMode("templates")}>
                    Templates
                  </AdminButton>
                  <AdminButton variant="primary" icon={FiPlus} onClick={() => handleOpenInvoiceModal("create")}>
                    Generate Invoice
                  </AdminButton>
                </>
              )}
              {viewMode === "templates" && (
                <AdminButton variant="primary" icon={FiPlus} onClick={() => handleOpenTemplateBuilder(null)}>
                  Create PDF Template
                </AdminButton>
              )}
              {viewMode === "builder" && (
                <AdminButton variant="primary" icon={FiCheck} onClick={() => { setViewMode("templates"); setSelectedSectionId(null); setSelectedColumnId(null); setSelectedWidgetId(null); }}>
                  Finish Designing
                </AdminButton>
              )}
            </div>
          </header>

          {viewMode === "invoices" && (
            <div className={styles.tableCardFrame}>
              <table className={styles.invoiceTableGrid}>
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Target Client Account</th>
                    <th>Date Generated</th>
                    <th>Associated Product Scope</th>
                    <th>Gross Matrix Value</th>
                    <th className={styles.textRight}>Available Options</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const productObj = KYLAS_PRODUCTS.find(p => p.value === inv.productId);
                    return (
                      <tr key={inv.id}>
                        <td className={styles.fontCodeIdentity}>{inv.id}</td>
                        <td>
                          <div className={styles.customerStackCell}>
                            <span className={styles.custPrimaryName}>{inv.customer}</span>
                            <span className={styles.custSubEmail}>{inv.email}</span>
                          </div>
                        </td>
                        <td className={styles.dateStampCell}>{inv.date}</td>
                        <td className={styles.productCell}>{productObj?.label || inv.productId}</td>
                        <td className={styles.valueTotalBoldCell}>₹{inv.total.toLocaleString("en-IN")}</td>
                        <td>
                          <div className={styles.actionsCellRow}>
                            <button className={styles.iconActionBtn} onClick={() => handleOpenInvoiceModal("view", inv)} title="Preview Live PDF Overlay Mapping">
                              <FiEye />
                            </button>
                            <button className={styles.iconActionBtn} onClick={() => handleOpenInvoiceModal("edit", inv)} title="Update Baseline Parameters">
                              <FiEdit2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === "templates" && (
            <div className={styles.templatesPanelLayout}>
              <div className={styles.tableCardFrame}>
                <table className={styles.invoiceTableGrid}>
                  <thead>
                    <tr>
                      <th>Layout Template Blueprint Name</th>
                      <th>Operational Scope Priority Mapping</th>
                      <th>System Rule Flag</th>
                      <th className={styles.textRight}>Available Options</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((tmpl) => {
                      const linkedProduct = KYLAS_PRODUCTS.find(p => p.value === tmpl.attachedProductId);
                      return (
                        <tr key={tmpl.id}>
                          <td className={styles.custPrimaryName}>{tmpl.name}</td>
                          <td className={styles.dateStampCell}>
                            {tmpl.isDefault ? "Global Core Fallback Configuration Layer" : `Exclusive Product Overwrite: ${linkedProduct?.label || "Alternative General"}`}
                          </td>
                          <td>
                            <span className={`${styles.statusLabelBadge} ${tmpl.isDefault ? styles.statusActive : styles.statusMapped}`}>
                              {tmpl.isDefault ? "Standard Default Blueprint" : "Dynamic Override Registered"}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionsCellRow}>
                              <button className={styles.iconActionBtn} onClick={() => handleOpenTemplatePreview(tmpl)} title="View Live Blueprint Preview Layout">
                                <FiEye />
                              </button>
                              <button className={styles.iconActionBtn} onClick={() => handleOpenTemplateBuilder(tmpl)} title="Configure Components Matrix Canvas">
                                <FiEdit2 />
                              </button>
                              {!tmpl.isDefault && (
                                <button className={styles.iconActionBtn} onClick={() => setTemplates(templates.filter(t => t.id !== tmpl.id))} title="Purge Template Structure Node">
                                  <FiTrash2 />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === "builder" && (
            <div className={styles.builderWorkspaceWrapper}>
              <div className={styles.builderSidebarControls}>
                
                {/* --- TEMPLATE METADATA --- */}
                {!selectedSectionId && !selectedWidgetInstance && (
                  <>
                    <div className={styles.controlGroupBlock}>
                      <label className={styles.controlMetaLabel}>Template Blueprint Name</label>
                      <input type="text" className={styles.builderTextInputField} placeholder="E.g., Premium Society Layout" value={tmplName} onChange={(e) => setTmplName(e.target.value)} />
                    </div>

                    {!activeTemplate?.isDefault && (
                      <div className={styles.controlGroupBlock}>
                        <label className={styles.controlMetaLabel}>Override Priority Allocation</label>
                        <select className={styles.builderSelectField} value={tmplProduct} onChange={(e) => setTmplProduct(e.target.value)}>
                          <option value="none">General template (No auto-override trigger link)</option>
                          {KYLAS_PRODUCTS.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className={styles.themeCustomizationWidgetBoxContainer}>
                      <label className={styles.controlMetaLabel}>Global Theme Colors</label>
                      <div className={styles.themeFormInputsDualGridInlineRow}>
                        <div className={styles.controlGroupBlock}>
                          <span className={styles.inlineColorLabelMini}>Primary Brand</span>
                          <input type="color" value={tmplTheme.primaryColor} onChange={(e) => setTmplTheme({ ...tmplTheme, primaryColor: e.target.value })} />
                        </div>
                        <div className={styles.controlGroupBlock}>
                          <span className={styles.inlineColorLabelMini}>Typography</span>
                          <input type="color" value={tmplTheme.textColor} onChange={(e) => setTmplTheme({ ...tmplTheme, textColor: e.target.value })} />
                        </div>
                        <div className={styles.controlGroupBlock}>
                          <span className={styles.inlineColorLabelMini}>Document Sheet</span>
                          <input type="color" value={tmplTheme.backgroundColor} onChange={(e) => setTmplTheme({ ...tmplTheme, backgroundColor: e.target.value })} />
                        </div>
                        <div className={styles.controlGroupBlock}>
                          <span className={styles.inlineColorLabelMini}>Grid Borders</span>
                          <input type="color" value={tmplTheme.borderColor} onChange={(e) => setTmplTheme({ ...tmplTheme, borderColor: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* --- SECTION SETTINGS --- */}
                {selectedSectionId && !selectedColumnId && !selectedWidgetId && activeSelectedSection && (
                  <div className={styles.inlineComponentSettingsEditorCard}>
                    <div className={styles.settingsCardHeaderBlockRow}>
                      <h6><FiSettings /> Section Master Styles</h6>
                      <button className={styles.dismissSettingsBtn} onClick={() => setSelectedSectionId(null)}>&times;</button>
                    </div>

                    <div className={styles.colorSelectionFormGridRow}>
                      <div className={styles.controlGroupBlock}>
                        <label className={styles.controlMetaLabel}>Background Fill Color</label>
                        <input 
                          type="color" 
                          className={styles.colorInputElementNode} 
                          value={activeSelectedSection.style?.backgroundColor || "#ffffff"} 
                          onChange={(e) => handleUpdateSectionStyle(selectedSectionId, "backgroundColor", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className={styles.controlGroupBlock}>
                      <label className={styles.controlMetaLabel}>Background Image URL (Optional)</label>
                      <input 
                        type="text" 
                        className={styles.builderTextInputField} 
                        placeholder="https://..."
                        value={activeSelectedSection.style?.backgroundImage || ""} 
                        onChange={(e) => handleUpdateSectionStyle(selectedSectionId, "backgroundImage", e.target.value)}
                      />
                    </div>

                    <div className={styles.colorSelectionFormGridRow}>
                      <div className={styles.controlGroupBlock}>
                        <label className={styles.controlMetaLabel}>Top Spacing (Padding)</label>
                        <input 
                          type="text" 
                          className={styles.builderTextInputField} 
                          placeholder="e.g. 20px"
                          value={activeSelectedSection.style?.paddingTop || "0px"} 
                          onChange={(e) => handleUpdateSectionStyle(selectedSectionId, "paddingTop", e.target.value)}
                        />
                      </div>
                      <div className={styles.controlGroupBlock}>
                        <label className={styles.controlMetaLabel}>Bottom Spacing (Padding)</label>
                        <input 
                          type="text" 
                          className={styles.builderTextInputField} 
                          placeholder="e.g. 20px"
                          value={activeSelectedSection.style?.paddingBottom || "0px"} 
                          onChange={(e) => handleUpdateSectionStyle(selectedSectionId, "paddingBottom", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* --- COLUMN WIDTH CONTROL --- */}
                {activeSelectedColumn && !selectedWidgetInstance && (
                  <div className={styles.sidebarColumnManagerBoxPanel}>
                    <div className={styles.sidebarColumnMetaLabelRow}>
                      <span>Structural Column Active Management</span>
                      <button className={styles.dismissSettingsBtnMini} onClick={() => setSelectedColumnId(null)}>&times;</button>
                    </div>
                    <div className={styles.sidebarColumnRowActionsStack}>
                      <div className={styles.sidebarColumnSliderControlRow}>
                        <label>Flex Width Percentage: {activeSelectedColumn.width}%</label>
                        <input 
                          type="range" min="10" max="100" value={activeSelectedColumn.width} 
                          onChange={(e) => handleResizeColumnWidth(activeSelectedColumn.sectionId, activeSelectedColumn.columnId, Number(e.target.value))} 
                        />
                      </div>
                      <button 
                        type="button" 
                        className={styles.sidebarDeleteColumnBtnLine}
                        onClick={() => handleRemoveColumnFromSection(activeSelectedColumn.sectionId, activeSelectedColumn.columnId)}
                      >
                        <FiTrash2 /> Purge Selected Column Grid Node
                      </button>
                    </div>
                  </div>
                )}

                {/* --- COMPONENT SETTINGS --- */}
                {selectedWidgetInstance && (
                  <div className={styles.inlineComponentSettingsEditorCard}>
                    <div className={styles.settingsCardHeaderBlockRow}>
                      <h6>Block Property Inspector</h6>
                      <button className={styles.dismissSettingsBtn} onClick={() => setSelectedWidgetId(null)}>&times;</button>
                    </div>

                    {selectedWidgetInstance.type !== "table" && (
                      <div className={styles.controlGroupBlock}>
                        <label className={styles.controlMetaLabel}>Display Content Text String</label>
                        <textarea 
                          className={styles.builderTextareaInputField} rows={4} value={selectedWidgetInstance.text || ""}
                          onChange={(e) => handleUpdateWidgetField(selectedWidgetInstance.widgetId, "text", e.target.value)}
                        />
                      </div>
                    )}

                    {selectedWidgetInstance.type === "text" && (
                      <div className={styles.textFormattingOptionsGridRow}>
                        <button className={`${styles.formatToggleActionBtn} ${selectedWidgetInstance.bold ? styles.formatActive : ""}`} onClick={() => handleUpdateWidgetField(selectedWidgetInstance.widgetId, "bold", !selectedWidgetInstance.bold)}>Bold</button>
                        <button className={`${styles.formatToggleActionBtn} ${selectedWidgetInstance.italic ? styles.formatActive : ""}`} onClick={() => handleUpdateWidgetField(selectedWidgetInstance.widgetId, "italic", !selectedWidgetInstance.italic)}>Italic</button>
                      </div>
                    )}

                    {selectedWidgetInstance.type === "list" && (
                      <div className={styles.controlGroupBlock}>
                        <label className={styles.controlMetaLabel}>List Bullet Notation Scheme</label>
                        <select className={styles.builderSelectField} value={selectedWidgetInstance.listType || "bullet"} onChange={(e) => handleUpdateWidgetField(selectedWidgetInstance.widgetId, "listType", e.target.value)}>
                          <option value="bullet">Standard Circular Bullets (•)</option>
                          <option value="number">Sequential Decimals (1, 2, 3)</option>
                          <option value="icon">Decorative Vector Box Checkboxes (✓)</option>
                        </select>
                      </div>
                    )}

                    {selectedWidgetInstance.type === "image" && (
                      <div className={styles.controlGroupBlock}>
                        <label className={styles.controlMetaLabel}>Branding Asset URL Link Source</label>
                        <input type="text" className={styles.builderTextInputField} value={selectedWidgetInstance.imageUrl || ""} onChange={(e) => handleUpdateWidgetField(selectedWidgetInstance.widgetId, "imageUrl", e.target.value)} />
                      </div>
                    )}

                    {selectedWidgetInstance.type === "video" && (
                      <div className={styles.controlGroupBlock}>
                        <label className={styles.controlMetaLabel}>Embedded Video Address</label>
                        <input type="text" className={styles.builderTextInputField} placeholder="YouTube or Vimeo web link URL..." value={selectedWidgetInstance.videoUrl || ""} onChange={(e) => handleUpdateWidgetField(selectedWidgetInstance.widgetId, "videoUrl", e.target.value)} />
                      </div>
                    )}
                  </div>
                )}

                {/* --- ADD SECTION BUTTONS (Visible when nothing is focused) --- */}
                {!selectedSectionId && !selectedWidgetInstance && !selectedColumnId && (
                  <div className={styles.layoutStructuralRowInjectorZoneBox}>
                    <label className={styles.controlMetaLabel}>Structural Layout Controls</label>
                    <div className={styles.structuralActionTriggerButtonsGridRow}>
                      <button className={styles.layoutActionInjectBtnNode} onClick={() => handleAddSectionRow("standard")}><FiPlus /> Section Container</button>
                    </div>
                  </div>
                )}

                {/* --- WIDGET LIBRARY (Visible only when column is selected) --- */}
                {selectedColumnId && !selectedWidgetInstance && (
                  <div className={styles.componentAssetLibraryCardTrayBlock}>
                    <label className={styles.controlMetaLabel}>Available Components (Drag or Click)</label>
                    <div className={styles.componentAssetIconsGridMatrixItemsStack}>
                      {[
                        { type: "header", label: "Title", icon: FiType },
                        { type: "subtitle", label: "Subtitle", icon: FiSliders },
                        { type: "text", label: "Body Text", icon: FiFileText },
                        { type: "list", label: "Lists Engine", icon: FiList },
                        { type: "image", label: "Image Box", icon: FiImage },
                        { type: "video", label: "Embedded Video", icon: FiVideo },
                        { type: "table", label: "Items Grid", icon: FiGrid },
                        { type: "metadata", label: "Variables Panel", icon: FiCode },
                        { type: "signoff", label: "Verification", icon: FiCheck }
                      ].map(asset => {
                        const IconComponent = asset.icon;
                        return (
                          <button 
                            key={asset.type}
                            onClick={() => handleAddWidgetToColumn(selectedSectionId, selectedColumnId, asset.type)}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("new_widget", asset.type);
                              setIsDragging(true);
                            }}
                            onDragEnd={() => setIsDragging(false)}
                            title={`Drag or Click to insert ${asset.label}`}
                          >
                            <IconComponent />
                            <span>{asset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* --- VARIABLES DICTIONARY --- */}
                <div className={styles.apiVariablesDictionaryReferenceGuideCardBlock}>
                  <label className={styles.controlMetaLabel}>Dynamic Variable Tokens</label>
                  <div className={styles.searchVariableInputContainer}>
                    <FiSearch className={styles.searchVariableInputIcon} />
                    <input 
                      type="text" 
                      className={styles.builderTextInputField} 
                      placeholder="Search mapping tokens..."
                      value={variableSearch}
                      onChange={(e) => setVariableSearch(e.target.value)}
                    />
                  </div>
                  <div className={styles.dictionaryListItemsScrollingStack}>
                    {filteredVariables.map((v) => (
                      <div key={v.token} className={styles.dictionaryRowCardItemLine} onClick={() => copyToClipboard(v.token)}>
                        <code className={styles.dictionaryTokenFieldCodeHighlight}>{v.token}</code>
                        <span>{v.description}</span>
                      </div>
                    ))}
                    {filteredVariables.length === 0 && (
                      <div className={styles.noSearchMatchStateLabel}>No dynamic variables matched scope.</div>
                    )}
                  </div>
                </div>

              </div>

              <div className={styles.builderPreviewContainerPlane}>
                <div className={styles.previewToolbarDeviceFilterRow}>
                  <span className={styles.pdfSimIndicatorLabel}><FiPrinter /> Standard DIN A4 Document Live Sheet Print Simulator</span>
                </div>
                <div className={styles.canvasPreviewViewportFrameA4AestheticSheet}>
                  {renderDocumentCanvasSections(tmplSections, tmplTheme, null)}
                </div>
              </div>
            </div>
          )}

          {invoiceModalMode && (
            <div className={styles.modalViewportOverlay} onClick={() => setInvoiceModalOpen(null)}>
              <div className={`${styles.modalContentCardSheet} ${invoiceModalMode === "view" ? styles.modalContentCardSheetExpandedA4Viewport : ""}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeaderTitleArea}>
                  <h3>
                    {invoiceModalMode === "create" && "Generate Invoice Record"}
                    {invoiceModalMode === "edit" && `Update Invoice Parameters: ${activeInvoice?.id}`}
                    {invoiceModalMode === "view" && `Invoice PDF Document Print Preview: ${activeInvoice?.id}`}
                  </h3>
                  <button className={styles.modalCloseBtnCross} onClick={() => setInvoiceModalOpen(null)}>&times;</button>
                </div>

                {invoiceModalMode === "view" && activeInvoice ? (
                  <div className={styles.modalScrollablePDFPreviewCanvasBodyHousingContainer}>
                    {(() => {
                      const matchedTemplate = templates.find(t => t.attachedProductId === activeInvoice.productId) || templates.find(t => t.isDefault);
                      return renderDocumentCanvasSections(matchedTemplate.sections, matchedTemplate.theme, activeInvoice);
                    })()}
                  </div>
                ) : (
                  <form onSubmit={handleSaveInvoice} className={styles.invoiceInteractiveFormStack}>
                    <div className={styles.formRowTwoColumnGrid}>
                      <div className={styles.inputFieldGroupBlock}>
                        <label>Client Name</label>
                        <input type="text" placeholder="Enter target organization name..." value={invCustomer} onChange={(e) => setInvCustomer(e.target.value)} required />
                      </div>
                      <div className={styles.inputFieldGroupBlock}>
                        <label>Client Email</label>
                        <input type="email" placeholder="billing@entity.com" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} required />
                      </div>
                    </div>

                    <div className={styles.inputFieldGroupBlock}>
                      <label>Kylas Sync Catalog Product Mapping</label>
                      <select className={styles.builderSelectField} value={invProduct} onChange={(e) => setInvProduct(e.target.value)}>
                        {KYLAS_PRODUCTS.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formRowTwoColumnGrid}>
                      <div className={styles.inputFieldGroupBlock}>
                        <label>Quantity</label>
                        <input type="number" min="1" placeholder="1" value={invQty} onChange={(e) => setInvQty(e.target.value)} required />
                      </div>
                      <div className={styles.inputFieldGroupBlock}>
                        <label>Unit Purchase Rate (₹)</label>
                        <input type="number" min="0" placeholder="0" value={invRate} onChange={(e) => setInvRate(e.target.value)} required />
                      </div>
                    </div>

                    <div className={styles.modalFooterActionsBlockRow}>
                      <AdminButton variant="secondary" onClick={() => setInvoiceModalOpen(null)}>Cancel</AdminButton>
                      <AdminButton variant="primary" icon={FiCheck} type="submit">
                        {invoiceModalMode === "create" ? "Generate Invoice" : "Save Changes"}
                      </AdminButton>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {templatePreviewModalOpen && activeTemplate && (
            <div className={styles.modalViewportOverlay} onClick={() => setTemplatePreviewModalOpen(false)}>
              <div className={`${styles.modalContentCardSheet} ${styles.modalContentCardSheetExpandedA4Viewport}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeaderTitleArea}>
                  <h3>Invoice Template Layout Demo Render Simulation</h3>
                  <button className={styles.modalCloseBtnCross} onClick={() => setTemplatePreviewModalOpen(false)}>&times;</button>
                </div>
                <div className={styles.modalScrollablePDFPreviewCanvasBodyHousingContainer}>
                  {renderDocumentCanvasSections(activeTemplate.sections, activeTemplate.theme, null)}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}