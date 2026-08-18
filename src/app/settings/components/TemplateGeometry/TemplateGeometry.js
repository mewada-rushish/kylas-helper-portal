"use client";

import React, { useState, useEffect } from "react";
import { 
  FiMaximize, FiAlertCircle, FiInfo, FiHash, FiCheck,
  FiPlus, FiTrash2, FiEdit2, FiSave, FiX
} from "react-icons/fi";
import toast from "react-hot-toast";
import AdminButton from "@/components/ui/button/button";
import CustomDropdown from "@/components/ui/dropdown/dropdown";
import SkeletonLoader from "@/components/ui/skeleton/skeleton";
import styles from "./TemplateGeometry.module.css";

const DEFAULT_VARS = [
  { key: "invoice.id", type: "text", min: 0, max: 0 },
  { key: "current.date", type: "date", min: 0, max: 0 },
  { key: "customer.name", type: "text", min: 0, max: 0 },
  { key: "customer.email", type: "text", min: 0, max: 0 },
  { key: "memberId", type: "text", min: 0, max: 0 },
  { key: "amount.words", type: "text", min: 0, max: 0 },
  { key: "product.name", type: "text", min: 0, max: 0 },
  { key: "payment.periodStart", type: "date", min: 0, max: 0 },
  { key: "payment.periodEnd", type: "date", min: 0, max: 0 },
  { key: "payment.method", type: "text", min: 0, max: 0 },
  { key: "payment.referenceNo", type: "text", min: 0, max: 0 },
  { key: "payment.bankName", type: "text", min: 0, max: 0 },
  { key: "payment.date", type: "date", min: 0, max: 0 },
  { key: "invoice.subtotal", type: "number", min: 0, max: 0 },
  { key: "invoice.cgst", type: "number", min: 0, max: 0 },
  { key: "invoice.sgst", type: "number", min: 0, max: 0 },
  { key: "invoice.total", type: "number", min: 0, max: 0 }
];

export default function TemplateGeometry() {
  const [defaultPageSize, setDefaultPageSize] = useState("A4");
  const [defaultOrientation, setDefaultOrientation] = useState("portrait");
  const [globalMargin, setGlobalMargin] = useState(30);
  const [nullStrategy, setNullStrategy] = useState("fallback");
  
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [templateVariables, setTemplateVariables] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editForm, setEditForm] = useState({ key: "", type: "text", min: 0, max: 0 });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.templatePageSize) setDefaultPageSize(data.templatePageSize);
          if (data.templateOrientation) setDefaultOrientation(data.templateOrientation);
          if (data.templateMargin !== undefined) setGlobalMargin(data.templateMargin);
          if (data.templateNullStrategy) setNullStrategy(data.templateNullStrategy);
          
          if (data.templateVariablesSchema) {
            setTemplateVariables(JSON.parse(data.templateVariablesSchema));
          } else {
            // Default initialization
            setTemplateVariables(DEFAULT_VARS);
          }
        }
      } catch (err) {
        toast.error("Failed to fetch settings");
      } finally {
        setIsFetching(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templatePageSize: defaultPageSize,
          templateOrientation: defaultOrientation,
          templateMargin: globalMargin,
          templateNullStrategy: nullStrategy,
          templateVariablesSchema: JSON.stringify(templateVariables)
        })
      });

      if (res.ok) {
        toast.success("Template settings saved successfully");
      } else {
        throw new Error("Save failed");
      }
    } catch (err) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const nullStrategyOptions = [
    { value: "fallback", label: "Print Fallback String (e.g. N/A)" },
    { value: "drop_row", label: "Omit Undefined Elements Dynamically" },
    { value: "abort", label: "Halt Document Generation Pipeline" }
  ];

  const canvasOptions = [
    { value: "A4", label: "A4 Standard Printable Sheet (794px x 1123px)" },
    { value: "Letter", label: "US Letter Format Canvas Profile" }
  ];

  const typeOptions = [
    { value: "text", label: "Text String" },
    { value: "number", label: "Numeric Value" },
    { value: "date", label: "Date" },
    { value: "currency", label: "Currency" }
  ];

  const handleAddVariable = () => {
    setEditingIndex(templateVariables.length);
    setEditForm({ key: "", type: "text", min: 0, max: 0 });
  };

  const handleSaveVariable = () => {
    if (!editForm.key.trim()) {
      toast.error("Variable key is required.");
      return;
    }
    
    // Check duplicates
    const isDuplicate = templateVariables.some((v, idx) => v.key === editForm.key && idx !== editingIndex);
    if (isDuplicate) {
      toast.error("Variable key already exists.");
      return;
    }

    const updated = [...templateVariables];
    if (editingIndex >= updated.length) {
      updated.push({ ...editForm });
    } else {
      updated[editingIndex] = { ...editForm };
    }
    setTemplateVariables(updated);
    setEditingIndex(-1);
  };

  const handleRemoveVariable = (idx) => {
    if (!confirm("Are you sure you want to remove this variable?")) return;
    const updated = [...templateVariables];
    updated.splice(idx, 1);
    setTemplateVariables(updated);
  };

  return (
    <div className={styles.settingsFormViewNode}>
      <div className={styles.sectionBrandingHeaderLine} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Template Blueprint & Variable Core</h2>
          <p className={styles.sectionSubtitleText}>
            Establish base canvas layouts and define the data schema for your template variables.
          </p>
        </div>
        <AdminButton 
          variant="primary" 
          icon={FiCheck} 
          onClick={handleSaveSettings}
          disabled={isSaving || isFetching || editingIndex !== -1}
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </AdminButton>
      </div>
      <hr className={styles.sectionDivider} />

      {isFetching ? (
        <div className={styles.premiumDashboardFormGridCanvas}>
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
        </div>
      ) : (
        <div className={styles.premiumDashboardFormGridCanvas}>
          
          {/* Layout Geometry Configuration */}
          <div className={styles.formSectionGridBlockCard}>
            <h3>Print Layout Geometry</h3>
            
            <div className={styles.canvasConfigRow}>
              <div className={`${styles.formInputGroupField} ${styles.canvasDropdownColumn}`}>
                <label className={styles.fieldLabel}>Inherent Canvas Profile Standard</label>
                <CustomDropdown 
                  options={canvasOptions}
                  selectedValue={defaultPageSize}
                  onSelect={(val) => setDefaultPageSize(val)}
                  icon={FiMaximize}
                />
              </div>

              <div className={`${styles.formInputGroupField} ${styles.paddingInputColumn}`}>
                <label className={styles.fieldLabel}>Bleed (px)</label>
                <div className={styles.inputIconWrapperFrame}>
                  <FiHash className={styles.fieldInputIconAddon} />
                  <input 
                    type="number" 
                    min="0"
                    max="200"
                    value={globalMargin} 
                    onChange={(e) => setGlobalMargin(Number(e.target.value))} 
                    className={styles.primaryTextInputWithIcon} 
                    placeholder="24"
                  />
                </div>
              </div>
            </div>

            <div className={styles.formInputGroupField}>
              <label className={styles.fieldLabel}>Base Blueprint Sheet Orientation</label>
              <div className={styles.flexRadioSelectionContainerRow}>
                <label className={styles.radioElementOptionLabel}>
                  <input 
                    type="radio" 
                    name="orientation" 
                    value="portrait" 
                    checked={defaultOrientation === "portrait"} 
                    onChange={() => setDefaultOrientation("portrait")} 
                  />
                  <span className={styles.radioCustomCircle} />
                  <span className={styles.radioTextLabel}>Vertical Portrait Layout</span>
                </label>
                <label className={styles.radioElementOptionLabel}>
                  <input 
                    type="radio" 
                    name="orientation" 
                    value="landscape" 
                    checked={defaultOrientation === "landscape"} 
                    onChange={() => setDefaultOrientation("landscape")} 
                  />
                  <span className={styles.radioCustomCircle} />
                  <span className={styles.radioTextLabel}>Horizontal Landscape Layout</span>
                </label>
              </div>
            </div>
          </div>

          {/* Runtime Controls Configuration */}
          <div className={styles.formSectionGridBlockCard}>
            <h3>Data Fallback & Compilation Governance</h3>

            <div className={styles.formInputGroupField}>
              <label className={styles.fieldLabel}>Null / Missing Path Extraction Strategy</label>
              <CustomDropdown 
                options={nullStrategyOptions}
                selectedValue={nullStrategy}
                onSelect={(val) => setNullStrategy(val)}
                icon={FiAlertCircle}
              />
            </div>

            <div className={styles.informationalNoticeAlertRow} style={{ marginTop: '16px' }}>
              <FiInfo size={16} className={styles.noticeIcon} />
              <p>
                Configure how the generator handles variables that receive no data during the invoice creation process.
              </p>
            </div>
          </div>

          {/* Variables Schema Manager */}
          <div className={`${styles.formSectionGridBlockCard} ${styles.fullWidthGridSpanCard}`}>
            <div className={styles.matrixHeadingRow}>
              <h3>Template Variables Data Schema</h3>
              <AdminButton variant="secondary" icon={FiPlus} onClick={handleAddVariable} disabled={editingIndex !== -1}>
                Add Variable
              </AdminButton>
            </div>
            <p className={styles.tableInstructionalBody}>
              Define the data types and limits for the variables used in your templates. These will be automatically exposed to the Automation workflow blocks. 0 = No limit.
            </p>

            <div className={styles.matrixContainerFrameWrapper}>
              <div className={styles.variableMappingStructuredGridHeader} style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 80px', display: 'grid', gap: '16px' }}>
                <span className={styles.headerColTokenKey}>Variable Key Token</span>
                <span className={styles.headerColTokenKey}>Data Type</span>
                <span className={styles.headerColTokenKey}>Min Val / Len</span>
                <span className={styles.headerColTokenKey}>Max Val / Len</span>
                <span className={styles.headerColTokenKey} style={{ textAlign: 'right' }}>Actions</span>
              </div>

              <div className={styles.variableMappingRowsStackList} style={{ marginTop: '8px' }}>
                {templateVariables.map((variable, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 80px', gap: '16px', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: editingIndex === idx ? '#f8fafc' : 'transparent' }}>
                    {editingIndex === idx ? (
                      <>
                        <input 
                          type="text" 
                          value={editForm.key} 
                          onChange={(e) => setEditForm({...editForm, key: e.target.value})} 
                          style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%' }} 
                          placeholder="e.g. invoice.id"
                        />
                        <div className="dropdownContainerParent">
                          <CustomDropdown 
                            options={typeOptions}
                            selectedValue={editForm.type}
                            onSelect={(val) => setEditForm({...editForm, type: val})}
                          />
                        </div>
                        <input 
                          type="number" 
                          value={editForm.min} 
                          onChange={(e) => setEditForm({...editForm, min: Number(e.target.value)})} 
                          style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%' }}
                        />
                        <input 
                          type="number" 
                          value={editForm.max} 
                          onChange={(e) => setEditForm({...editForm, max: Number(e.target.value)})} 
                          style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%' }}
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={handleSaveVariable} style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Save">
                            <FiSave size={18} />
                          </button>
                          <button onClick={() => setEditingIndex(-1)} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Cancel">
                            <FiX size={18} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontFamily: 'monospace', fontWeight: '600', color: '#334155' }}>{"{{"}{variable.key}{"}}"}</div>
                        <div>
                          <span style={{ display: 'inline-block', padding: '4px 8px', background: '#e2e8f0', borderRadius: '4px', fontSize: '12px', fontWeight: '500', color: '#475569', textTransform: 'capitalize' }}>
                            {variable.type}
                          </span>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '14px' }}>{variable.min === 0 ? "No limit" : variable.min}</div>
                        <div style={{ color: '#64748b', fontSize: '14px' }}>{variable.max === 0 ? "No limit" : variable.max}</div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => { setEditingIndex(idx); setEditForm({ ...variable }); }} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Edit">
                            <FiEdit2 size={16} />
                          </button>
                          <button onClick={() => handleRemoveVariable(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Delete">
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                
                {/* Blank row for adding new if empty */}
                {templateVariables.length === 0 && editingIndex === -1 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    No variables defined. Click "Add Variable" to start mapping your template data schema.
                  </div>
                )}
                
                {/* Adding a new variable row at the end */}
                {editingIndex === templateVariables.length && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 80px', gap: '16px', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <input 
                      type="text" 
                      value={editForm.key} 
                      onChange={(e) => setEditForm({...editForm, key: e.target.value})} 
                      style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%' }} 
                      placeholder="e.g. invoice.id"
                      autoFocus
                    />
                    <div className="dropdownContainerParent">
                      <CustomDropdown 
                        options={typeOptions}
                        selectedValue={editForm.type}
                        onSelect={(val) => setEditForm({...editForm, type: val})}
                      />
                    </div>
                    <input 
                      type="number" 
                      value={editForm.min} 
                      onChange={(e) => setEditForm({...editForm, min: Number(e.target.value)})} 
                      style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%' }}
                    />
                    <input 
                      type="number" 
                      value={editForm.max} 
                      onChange={(e) => setEditForm({...editForm, max: Number(e.target.value)})} 
                      style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={handleSaveVariable} style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Save">
                        <FiSave size={18} />
                      </button>
                      <button onClick={() => setEditingIndex(-1)} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Cancel">
                        <FiX size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}