"use client";

import React, { useState, useEffect } from "react";
import { 
  FiMaximize, FiLayers, FiCode, FiLink, 
  FiAlertCircle, FiInfo, FiHash, FiCheck 
} from "react-icons/fi";
import toast from "react-hot-toast";
import AdminButton from "@/components/ui/button/button";
import CustomDropdown from "@/components/ui/dropdown/dropdown";
import SkeletonLoader from "@/components/ui/skeleton/skeleton";
import styles from "./TemplateGeometry.module.css";

const DEFAULT_TOKENS = [
  "receipt_no",
  "date",
  "member_id",
  "customer.name",
  "customer.phone",
  "basic_amount",
  "cgst",
  "sgst",
  "total_amount",
  "amount_in_words",
  "payment_for",
  "payment_mode",
  "cheque_no",
  "bank_name",
  "dated",
  "user_name"
];

const createDefaultMapping = () => {
  return DEFAULT_TOKENS.reduce((acc, token) => {
    acc[token] = "";
    return acc;
  }, {});
};

export default function TemplateGeometry() {
  // Component layout state configuration
  const [defaultPageSize, setDefaultPageSize] = useState("A4");
  const [defaultOrientation, setDefaultOrientation] = useState("portrait");
  const [globalMargin, setGlobalMargin] = useState(24);
  const [nullStrategy, setNullStrategy] = useState("fallback");
  const [activeWebhookSource, setActiveWebhookSource] = useState("wh_kylas_lead_capture");
  
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newVariableKey, setNewVariableKey] = useState("");
  const [webhookConfigs, setWebhookConfigs] = useState([]);
  const [webhookProfileOptions, setWebhookProfileOptions] = useState([
    { value: "wh_kylas_lead_capture", label: "Kylas CRM Lead Webhook Pipeline (META_LEAD)" },
    { value: "wh_invoice_manual_trigger", label: "Manual Invoice Generator API Dispatch Hook" }
  ]);

  // Webhook-specific dynamic token mapping values
  const [allWebhookMappings, setAllWebhookMappings] = useState({});

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
          if (data.webhookMappings) setAllWebhookMappings(JSON.parse(data.webhookMappings));
        }

        const hooksRes = await fetch("/api/settings/incoming-webhooks");
        if (hooksRes.ok) {
          const hooksData = await hooksRes.json();
          setWebhookConfigs(hooksData);
          if (hooksData && hooksData.length > 0) {
            const dynamicOptions = hooksData.map(h => ({
              value: h.id,
              label: `${h.name} (${h.provider})`
            }));
            setWebhookProfileOptions(dynamicOptions);
            
            // If current active source is not in the new options, switch to the first one
            setActiveWebhookSource(prev => {
               if (!dynamicOptions.find(opt => opt.value === prev)) {
                 return dynamicOptions[0].value;
               }
               return prev;
            });
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
          webhookMappings: JSON.stringify(allWebhookMappings)
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

  const handleUpdateMappingPath = (tokenKey, updatedPath) => {
    setAllWebhookMappings(prev => {
      const sourceMap = prev[activeWebhookSource] || createDefaultMapping();
      return {
        ...prev,
        [activeWebhookSource]: {
          ...sourceMap,
          [tokenKey]: updatedPath
        }
      };
    });
  };

  const handleAddCustomVariable = () => {
    if (!newVariableKey.trim()) return;
    
    // Convert to token friendly format (lowercase, replace spaces with underscores)
    const formattedKey = newVariableKey.trim().toLowerCase().replace(/\s+/g, '_');
    
    setAllWebhookMappings(prev => {
      const sourceMap = prev[activeWebhookSource] || createDefaultMapping();
      if (sourceMap[formattedKey] !== undefined) {
        toast.error("Variable already exists");
        return prev;
      }
      return {
        ...prev,
        [activeWebhookSource]: {
          ...sourceMap,
          [formattedKey]: ""
        }
      };
    });
    setNewVariableKey("");
  };

  const handleRemoveCustomVariable = (tokenKey) => {
    setAllWebhookMappings(prev => {
      const sourceMap = { ...(prev[activeWebhookSource] || createDefaultMapping()) };
      delete sourceMap[tokenKey];
      return {
        ...prev,
        [activeWebhookSource]: sourceMap
      };
    });
  };

  const activeMappings = allWebhookMappings[activeWebhookSource] || createDefaultMapping();
  const activeWebhookConfig = webhookConfigs.find(w => w.id === activeWebhookSource);
  let availableVariables = [];
  if (activeWebhookConfig && activeWebhookConfig.selectedVariables) {
    try {
      availableVariables = JSON.parse(activeWebhookConfig.selectedVariables);
    } catch (e) {
      availableVariables = [];
    }
  }

  const MultiVariableSelector = ({ value, onChange, availableVars }) => {
    const selectedItems = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
    const [selectedOpt, setSelectedOpt] = useState("");
    const [customText, setCustomText] = useState("");

    const handleAdd = (valToAdd) => {
      if (!valToAdd) return;
      const newItems = [...selectedItems, valToAdd];
      onChange(newItems.join(", "));
      setSelectedOpt("");
      setCustomText("");
    };

    const handleRemove = (idx) => {
      const newItems = [...selectedItems];
      newItems.splice(idx, 1);
      onChange(newItems.join(", "));
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        {selectedItems.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {selectedItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                {item}
                <button onClick={() => handleRemove(idx)} style={{ border: 'none', background: 'transparent', marginLeft: '6px', cursor: 'pointer', color: '#64748b', padding: 0 }}>&times;</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <CustomDropdown 
              placeholder="-- Select Variable --"
              options={[
                ...availableVars.map(v => {
                  const label = v.customName ? `${v.customName} (${v.path})` : v.path || String(v);
                  const val = v.path || String(v);
                  return { value: val, label: label };
                }),
                { value: "OTHER", label: "Other (Plain Text)" }
              ]}
              selectedValue={selectedOpt}
              activeValues={selectedItems}
              keepOpenOnSelect={true}
              onSelect={(val) => {
                if (val === "OTHER") {
                  setSelectedOpt("OTHER");
                } else if (val) {
                  const idx = selectedItems.indexOf(val);
                  if (idx > -1) {
                    handleRemove(idx);
                  } else {
                    handleAdd(val);
                  }
                } else {
                  setSelectedOpt("");
                }
              }}
            />
          </div>
          {selectedOpt === "OTHER" && (
            <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
              <input 
                type="text" 
                value={customText} 
                onChange={(e) => setCustomText(e.target.value)} 
                placeholder="Enter text..." 
                style={{ padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', flex: 1, fontSize: '0.85rem' }}
              />
              <button onClick={() => handleAdd(customText)} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.settingsFormViewNode}>
      
      <div className={styles.sectionBrandingHeaderLine} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Template Blueprint & Variable Core</h2>
          <p className={styles.sectionSubtitleText}>
            Establish base canvas dimension layouts and structurally map inbound webhook JSON payloads directly to dynamic rendering tokens.
          </p>
        </div>
        <AdminButton 
          variant="primary" 
          icon={FiCheck} 
          onClick={handleSaveSettings}
          disabled={isSaving || isFetching}
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
              <label className={styles.fieldLabel}>Active Data Hydration Source Hook</label>
              <CustomDropdown 
                options={webhookProfileOptions}
                selectedValue={activeWebhookSource}
                onSelect={(val) => setActiveWebhookSource(val)}
                icon={FiLayers}
              />
            </div>

            <div className={styles.formInputGroupField}>
              <label className={styles.fieldLabel}>Null / Missing Path Extraction Strategy</label>
              <CustomDropdown 
                options={nullStrategyOptions}
                selectedValue={nullStrategy}
                onSelect={(val) => setNullStrategy(val)}
                icon={FiAlertCircle}
              />
            </div>

            <div className={styles.informationalNoticeAlertRow}>
              <FiInfo size={16} className={styles.noticeIcon} />
              <p>
                Modifying the source hook switch context above allows you to map isolated parameter fields for separate webhook streams independently.
              </p>
            </div>
          </div>

          {/* Variable Mapping Dynamic Matrix Grid */}
          <div className={`${styles.formSectionGridBlockCard} ${styles.fullWidthGridSpanCard}`}>
            <div className={styles.matrixHeadingRow}>
              <h3>Dynamic Webhook Payload Variable Matrix Mappings</h3>
              <span className={styles.activeHookBadge}>
                Configuring: {webhookProfileOptions.find(opt => opt.value === activeWebhookSource)?.label}
              </span>
            </div>
            <p className={styles.tableInstructionalBody}>
              Bind standard system interpolation parameters to specific inbound JSON dot-notation expressions parsed from execution webhooks.
            </p>

            <div className={styles.matrixContainerFrameWrapper}>
              <div className={styles.variableMappingStructuredGridHeader}>
                <span className={styles.headerColTokenKey}>Target Template Variable Token</span>
                <span className={styles.headerColDirectionIcon}></span>
                <span className={styles.headerColJsonExpressionPath}>Inbound Webhook Payload Source Expression Path</span>
              </div>

              <div className={styles.variableMappingRowsStackList}>
                {Object.entries(activeMappings).map(([tokenKey, expressionPath]) => (
                  <div key={tokenKey} className={styles.variableMappingRecordInteractionRow} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    
                    <div className={styles.templateTokenIdentifierMetadataBlock} style={{ flex: '0 0 250px' }}>
                      <FiCode size={14} className={styles.tokenTagDecorativeIcon} />
                      <span className={styles.tokenTextLiteralLabel}>{"{{"}{tokenKey}{"}}"}</span>
                    </div>

                    <div className={styles.connectorDirectionalIndicatorColumn}>
                      <FiLink size={13} className={styles.connectorLinkChainIcon} />
                    </div>

                    <div className={styles.jsonExpressionInputTrackingFlexWrapper} style={{ flex: '1', display: 'flex', alignItems: 'center' }}>
                      <MultiVariableSelector 
                        value={expressionPath} 
                        onChange={(newVal) => handleUpdateMappingPath(tokenKey, newVal)}
                        availableVars={availableVariables}
                      />
                    </div>

                    {!DEFAULT_TOKENS.includes(tokenKey) && (
                      <button 
                        className={styles.removeVariableBtn} 
                        onClick={() => handleRemoveCustomVariable(tokenKey)}
                        style={{ padding: '8px 12px', background: '#ffebee', color: '#d32f2f', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                      >
                        Remove
                      </button>
                    )}
                    {DEFAULT_TOKENS.includes(tokenKey) && (
                      <div style={{ width: '70px', textAlign: 'center', fontSize: '0.75rem', color: '#999', fontWeight: 'bold' }}>DEFAULT</div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Add Custom Variable</label>
                  <input 
                    type="text" 
                    value={newVariableKey}
                    onChange={(e) => setNewVariableKey(e.target.value)}
                    placeholder="custom_variable_name"
                    style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'monospace' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomVariable()}
                  />
                </div>
                <AdminButton variant="secondary" onClick={handleAddCustomVariable}>
                  + Add Variable
                </AdminButton>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}