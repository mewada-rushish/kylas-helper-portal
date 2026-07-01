// src/app/invoices/templates/[id]/page.js
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  FiCheck, FiArrowLeft, FiSearch, FiBriefcase, 
  FiCode, FiMonitor, FiSmartphone, FiTablet, FiPlus,
  FiRotateCcw, FiRotateCw, FiChevronDown
} from "react-icons/fi";
import Sidebar from "@/components/layout/sidebar/sidebar";
import AdminButton from "@/components/ui/button/button";
import styles from "./editor.module.css";
import { resolveToken } from "@/lib/variable-resolver";
import DOMPurify from "isomorphic-dompurify";

// Monaco VS Code Core React Component Engine
import Editor from "@monaco-editor/react";

const DEFAULT_MARKUP_TEMPLATE = `<div style="padding: 30px; font-family: 'Poppins', sans-serif; color: #334155; max-width: 100%; box-sizing: border-box;">
  <div style="background-color: #27347B; padding: 24px; text-align: center; color: white; border-radius: 6px;">
    <h2 style="margin: 0; font-family: 'Montserrat', sans-serif; font-weight: 700; letter-spacing: 0.5px;">ASMITA OPERATIONS ACCOUNTS STATEMENT</h2>
    <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.9;">Document Reference ID: {{invoice.id}}</p>
  </div>

  <div style="margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 6px; background-color: #f8fafc;">
    <h3 style="margin: 0 0 4px 0; font-family: 'Montserrat', sans-serif; color: #27347B; font-size: 14px; text-transform: uppercase;">Accounts Payable Context Target</h3>
    <p style="margin: 2px 0; font-size: 13px;"><strong>Client Legal Entity:</strong> {{customer.name}}</p>
    <p style="margin: 2px 0; font-size: 13px;"><strong>AP Target Email:</strong> {{customer.email}}</p>
    <p style="margin: 2px 0; font-size: 13px;"><strong>Statement Date:</strong> {{current.date}}</p>
  </div>

  <div style="margin-top: 24px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <thead>
        <tr style="background-color: #27347B; color: white;">
          <th style="padding: 10px; text-align: left; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">Associated Operational License Item</th>
          <th style="padding: 10px; text-align: center;">Qty</th>
          <th style="padding: 10px; text-align: right;">Rate</th>
          <th style="padding: 10px; text-align: right; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Net Subtotal</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 10px; font-weight: 500; color: #0f172a;">{{product.name}}</td>
          <td style="padding: 12px 10px; text-align: center; color: #475569;">{{product.qty}}</td>
          <td style="padding: 12px 10px; text-align: right; color: #475569;">{{product.rate}}</td>
          <td style="padding: 12px 10px; text-align: right; font-weight: 600; color: #27347B;">{{invoice.total}}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div style="margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 16px; text-align: center; color: #64748b; font-size: 11px;">
    This accounts statement is secure, encrypted, and compiled via AsmitA Core ERP Infrastructure Stack.
  </div>
</div>`;

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

export default function TemplateEditorWorkspace() {
  const router = useRouter();
  
  // High-Assurance Monaco Component Reference Registers
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const scrollCanvasContainerRef = useRef(null);
  const previewSheetRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const [htmlContent, setHtmlContent] = useState(DEFAULT_MARKUP_TEMPLATE);
  const [previewDeviceMode, setPreviewDeviceMode] = useState("desktop"); 
  const [variableSearch, setVariableSearch] = useState("");
  const [zoomLevel, setZoomLevel] = useState(0.75); // Initial zoom factor level locked strictly at 75%
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [autoSaveBadge, setAutoSaveBadge] = useState("All changes saved");

  const currentContext = {
    id: "INV-DEMO-99",
    customer: "Alpha Society Test Corp",
    email: "finance@alphacorp.in",
    productId: "prod_crm_ent",
    qty: 1,
    rate: 45000,
    total: 53100,
    date: new Date().toISOString().split("T")[0]
  };

  // Sync zoom level adjustments directly via CSS variables properties
  useEffect(() => {
    const canvasElement = previewSheetRef.current;
    if (canvasElement) {
      canvasElement.style.setProperty("--studio-zoom-level", zoomLevel);
    }
  }, [zoomLevel]);

  // Intercept Ctrl + Scroll wheel magnification commands natively
  useEffect(() => {
    const zoomTargetElement = scrollCanvasContainerRef.current;
    if (!zoomTargetElement) return;

    const handleWheelZoomEvent = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const zoomDeltaFactor = 0.05;
        if (e.deltaY < 0) {
          setZoomLevel((prev) => Math.min(2.0, prev + zoomDeltaFactor));
        } else {
          setZoomLevel((prev) => Math.max(0.4, prev - zoomDeltaFactor));
        }
      }
    };

    zoomTargetElement.addEventListener("wheel", handleWheelZoomEvent, { passive: false });
    return () => zoomTargetElement.removeEventListener("wheel", handleWheelZoomEvent);
  }, []);

  useEffect(() => {
    function handleClickOutsideDropdown(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideDropdown);
    return () => document.removeEventListener("mousedown", handleClickOutsideDropdown);
  }, []);

  // Monaco Mounting Routine & Autocomplete Suggestion Injection Link
  const handleEditorOnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register high-fidelity custom completion rules for our custom tokens dictionary
    monaco.languages.registerCompletionItemProvider("html", {
      provideCompletionItems: (model, position) => {
        const suggestions = VARIABLE_DICTIONARY.map(v => ({
          label: v.token,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: v.token,
          detail: v.description,
          documentation: "Kylas Context Dynamic Replacement Field"
        }));
        return { suggestions };
      }
    });
  };

  // Trigger Monaco Native Core Command Stack For Undo Actions
  const triggerHistoryUndo = () => {
    if (editorRef.current) {
      editorRef.current.trigger("source-code-editor", "undo", "keyboard");
    }
  };

  // Trigger Monaco Native Core Command Stack For Redo Actions
  const triggerHistoryRedo = () => {
    if (editorRef.current) {
      editorRef.current.trigger("source-code-editor", "redo", "keyboard");
    }
  };

  const filteredVariables = VARIABLE_DICTIONARY.filter(v => 
    v.token.toLowerCase().includes(variableSearch.toLowerCase()) || 
    v.description.toLowerCase().includes(variableSearch.toLowerCase())
  );

  // Programmatic cursor text injection loop utilizing Monaco Range structures
  const handleInsertVariable = (token) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const position = editor.getPosition();
    const range = new monaco.Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column
    );

    // Insert text safely at current coordinate track bounds
    editor.executeEdits("tokens-injector", [
      { range: range, text: token, forceMoveMarkers: true }
    ]);
    
    setIsDropdownOpen(false);
    editor.focus();
  };

  const dynamicRenderedPreviewHTML = resolveToken(htmlContent, currentContext);

  const deviceScaleRatios = {
    desktop: 1.0,
    tablet: 0.72,
    mobile: 0.46
  };

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
                  <h1>PDF Blueprint Studio Markup Engine</h1>
                  <span className={styles.autoSaveStatusBadge}>{autoSaveBadge}</span>
                </div>
                <p>Input raw HTML template configuration syntax with integrated token link extensions.</p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <AdminButton variant="primary" icon={FiCheck} onClick={() => router.push("/invoices/templates")}>Finish Template</AdminButton>
            </div>
          </header>

          <div className={styles.studioWorkspaceSplitGrid}>
            
            {/* LEFT WORKSPACE: MONACO SOURCE CANVAS EDITOR (40% SCALE SHARE) */}
            <section className={styles.codePaneContainer}>
              <div className={styles.toolbarArea}>
                <div className={styles.toolbarLabelBlock}>
                  <FiCode className={styles.editorIconHighlight} />
                  <span>Source Code Canvas</span>
                </div>
                
                <div className={styles.historyActionGroupStrip}>
                  <button 
                    type="button" 
                    className={styles.toolbarUtilityIconBtn} 
                    onClick={triggerHistoryUndo}
                    title="Undo Changes (Ctrl+Z)"
                  >
                    <FiRotateCcw size={13} />
                  </button>
                  <button 
                    type="button" 
                    className={styles.toolbarUtilityIconBtn} 
                    onClick={triggerHistoryRedo}
                    title="Redo Changes (Ctrl+Y)"
                  >
                    <FiRotateCw size={13} />
                  </button>
                  <div className={styles.actionDividerVerticalBar} />
                  
                  <div className={styles.customDropdownContainer} ref={dropdownRef}>
                    <button 
                      type="button" 
                      className={`${styles.dropdownTriggerBtn} ${isDropdownOpen ? styles.dropdownActive : ""}`}
                      onClick={() => { setVariableSearch(""); setIsDropdownOpen(!isDropdownOpen); }}
                    >
                      <FiPlus size={12} />
                      <span>Tokens</span>
                      <FiChevronDown size={12} />
                    </button>

                    {isDropdownOpen && (
                      <div className={styles.searchableDropdownMenuWindow}>
                        <div className={styles.dropdownSearchInputWrapper}>
                          <FiSearch className={styles.dropdownSearchIcon} />
                          <input 
                            type="text" 
                            placeholder="Search token attributes..." 
                            value={variableSearch} 
                            onChange={(e) => setVariableSearch(e.target.value)}
                            autoFocus 
                          />
                        </div>
                        <ul className={styles.dropdownMenuListGroup}>
                          {filteredVariables.map((v) => (
                            <li 
                              key={v.token} 
                              className={styles.dropdownListItemRow}
                              onClick={() => handleInsertVariable(v.token)}
                            >
                              <code className={styles.variableCodeSnippetHighlight}>{v.token}</code>
                              <span className={styles.variableLabelDescriptionText}>{v.description}</span>
                            </li>
                          ))}
                          {filteredVariables.length === 0 && (
                            <li className={styles.dropdownEmptyFallbackRow}>No matches found</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Monaco White-Theme Viewport Layer Container */}
              <div className={styles.whiteThemeEditorLayerFrame}>
                <Editor
                  height="100%"
                  language="html"
                  theme="vs" 
                  value={htmlContent}
                  onChange={(val) => setHtmlContent(val ?? "")}
                  onMount={handleEditorOnMount}
                  options={{
                    minimap: { enabled: false },
                    wordWrap: "on",
                    fontSize: 13,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace',
                    lineHeight: 1.6,
                    automaticLayout: true,
                    tabSize: 2,
                    suggestOnTriggerCharacters: true, 
                    autoClosingTags: true,
                    autoClosingBrackets: "always",
                    formatOnType: true,
                    scrollBeyondLastLine: false, // FIX: Completely removes the extra empty spacing below the code
                    scrollbar: {
                      vertical: "auto",
                      horizontal: "auto",
                      verticalScrollbarSize: 10,
                      horizontalScrollbarSize: 10
                    }
                  }}
                />
              </div>
            </section>

            {/* RIGHT WORKSPACE: INVARIANT STATIC PDF VIEWER (60% SCALE SHARE) */}
            <section className={styles.previewPaneContainer}>
              <div className={styles.deviceBar}>
                <div className={styles.deviceBarLeftPlaceholder} />

                {/* Switcher tabs include clean icon layouts without text fields */}
                <div className={styles.devicePillGroup}>
                  <button 
                    type="button"
                    className={previewDeviceMode === "desktop" ? styles.activeDeviceBtn : styles.inactiveDeviceBtn} 
                    onClick={() => setPreviewDeviceMode("desktop")}
                    title="Desktop A4 View"
                  >
                    <FiMonitor size={14} />
                  </button>
                  <button 
                    type="button"
                    className={previewDeviceMode === "tablet" ? styles.activeDeviceBtn : styles.inactiveDeviceBtn} 
                    onClick={() => setPreviewDeviceMode("tablet")}
                    title="Tablet Scaling View"
                  >
                    <FiTablet size={14} />
                  </button>
                  <button 
                    type="button"
                    className={previewDeviceMode === "mobile" ? styles.activeDeviceBtn : styles.inactiveDeviceBtn} 
                    onClick={() => setPreviewDeviceMode("mobile")}
                    title="Mobile Scale View"
                  >
                    <FiSmartphone size={14} />
                  </button>
                </div>

                <div className={styles.zoomFactorFeedbackBadge}>
                  Zoom: {Math.round(zoomLevel * 100)}%
                </div>
              </div>

              <div 
                ref={scrollCanvasContainerRef}
                className={styles.canvasViewportFrame}
              >
                <div 
                  ref={previewSheetRef}
                  className={`${styles.pdfInvoiceLayoutContainerMock} ${styles[previewDeviceMode]}`}
                  style={{ 
                    "--device-scale-ratio": deviceScaleRatios[previewDeviceMode]
                  }}
                >
                  <div 
                    className={styles.htmlPreviewContainerWrapper}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(dynamicRenderedPreviewHTML) }} 
                  />
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}