"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FiSave, FiCopy, FiLoader, FiShield, FiRefreshCw, FiCheckSquare, FiSquare, FiPlus, FiSearch, FiArrowLeft, FiTrash2, FiActivity } from "react-icons/fi";
import CustomDropdown from "@/components/ui/dropdown/dropdown";
import toast from "react-hot-toast";
import styles from "../WorkflowSettings/WorkflowSettings.module.css"; // Reuse existing styles

export default function IncomingWebhooks() {
  const [webhooks, setWebhooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedWebhookId, setSelectedWebhookId] = useState(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);

  const activeWebhook = useMemo(() => {
    return webhooks.find(h => h.id === selectedWebhookId) || null;
  }, [webhooks, selectedWebhookId]);

  const fetchWebhooks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings/incoming-webhooks");
      if (res.ok) {
        const data = await res.json();
        const parsedData = data.map(hook => ({
          ...hook,
          selectedVariables: (() => {
            if (!hook.selectedVariables) return [];
            try { return JSON.parse(hook.selectedVariables); } catch(e) { return []; }
          })()
        }));
        setWebhooks(parsedData);
      }
    } catch (error) {
      console.error("Failed to load incoming webhooks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchLogs = async () => {
    if (!selectedWebhookId) return;
    setIsFetchingLogs(true);
    try {
      const res = await fetch(`/api/settings/incoming-webhooks/logs?webhookId=${selectedWebhookId}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to load webhook logs:", error);
    } finally {
      setIsFetchingLogs(false);
    }
  };

  useEffect(() => {
    if (selectedWebhookId) {
      fetchLogs();
    }
  }, [selectedWebhookId]);

  const handleCreateWebhook = async () => {
    try {
      const res = await fetch("/api/settings/incoming-webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Incoming Webhook #${webhooks.length + 1}`,
          provider: `CUSTOM_${Date.now()}`,
          authType: "NO_AUTH",
          authToken: "",
          isActive: true,
          isTestMode: false,
          selectedVariables: []
        })
      });
      if (!res.ok) throw new Error("Failed to create webhook");
      const newHook = await res.json();
      newHook.selectedVariables = [];
      setWebhooks(prev => [newHook, ...prev]);
      setSelectedWebhookId(newHook.id);
      toast.success("Webhook created!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to clear all test logs?")) return;
    try {
      const res = await fetch(`/api/settings/incoming-webhooks/logs?webhookId=${selectedWebhookId}`, { method: "DELETE" });
      if (res.ok) {
        setLogs([]);
        toast.success("Logs cleared successfully!");
      }
    } catch (error) {
      toast.error("Failed to clear logs");
    }
  };

  const handleDeleteWebhook = async (id) => {
    if (!confirm("Are you sure you want to delete this webhook endpoint permanently?")) return;
    try {
      const res = await fetch(`/api/settings/incoming-webhooks?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setWebhooks(prev => prev.filter(h => h.id !== id));
        if (selectedWebhookId === id) setSelectedWebhookId(null);
        toast.success("Webhook deleted");
      }
    } catch (error) {
      toast.error("Failed to delete webhook");
    }
  };

  const handleSave = async () => {
    if (!activeWebhook) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/incoming-webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeWebhook.id,
          name: activeWebhook.name,
          provider: activeWebhook.provider,
          endpointPath: activeWebhook.endpointPath,
          authType: activeWebhook.authType,
          authToken: activeWebhook.authToken,
          isActive: activeWebhook.isActive,
          isTestMode: activeWebhook.isTestMode,
          selectedVariables: activeWebhook.selectedVariables
        })
      });
      if (!res.ok) throw new Error("Failed to save configuration");
      toast.success("Webhook receiver configuration saved!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActiveState = async (id, currentVal) => {
    setWebhooks(prev => prev.map(hook => 
      hook.id === id ? { ...hook, isActive: !currentVal } : hook
    ));
    if (activeWebhook?.id === id) {
      // It's saved immediately on toggle, or we can just update local state and require Save.
      // We will let the user hit Save Changes to persist, to match the rest of the form.
    }
  };

  const handleToggleResponseVariable = (path, valueType = "text") => {
    if (!activeWebhook) return;
    const currentList = activeWebhook.selectedVariables || [];
    const exists = currentList.find(item => item.path === path);
    let newList;
    if (exists) {
      newList = currentList.filter(item => item.path !== path);
    } else {
      const defaultName = path.split('.').pop() || "variable_name";
      newList = [...currentList, { path, customName: defaultName, type: valueType }];
    }
    setWebhooks(prev => prev.map(h => h.id === selectedWebhookId ? { ...h, selectedVariables: newList } : h));
  };

  const renderResponsePayloadTreeNodes = (node, parentPath = "") => {
    if (typeof node !== "object" || node === null) return null;

    return Object.entries(node).map(([key, value]) => {
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      const isObject = typeof value === "object" && value !== null && !Array.isArray(value);
      const isArray = Array.isArray(value);
      const hasChildren = typeof value === "object" && value !== null;
      const isVariableSelected = activeWebhook?.selectedVariables?.some(v => v.path === currentPath);

      return (
        <div key={currentPath} style={{ marginLeft: "16px", display: "flex", flexDirection: "column" }}>
          <div className={styles.treeNodeStructuralRowItemLine}>
            <div className={styles.treeNodeLeafParameterRowFlexRowLayout}>
              <div className={styles.treeLeafKeyNameReadoutFlexRowLayout}>
                {hasChildren ? (
                  <span className={styles.objectEnclosureFolderLabelTextCode}>❖ {key}:</span>
                ) : (
                  <>
                    <span className={styles.treeLeafConnectorLinesLayoutGuideSpan}>└─</span>
                    <span className={styles.primitiveKeyNameTextCode}>{key}:</span>
                  </>
                )}
                
                <span style={{ fontStyle: "italic", color: "#64748B", fontSize: "12px", marginLeft: hasChildren ? '8px' : '0' }}>
                  {isArray ? `[Array (${value.length} items)]` : isObject ? `{Object (${Object.keys(value).length} keys)}` : `"${String(value)}"`}
                </span>
                <span className={styles.primitiveTypeNameTextBadge}>{isArray ? 'array' : typeof value}</span>
              </div>
              
              <button 
                type="button"
                className={`${styles.checkboxInteractiveTreeGateToggleButtonLink} ${isVariableSelected ? styles.gateActiveStateTextCode : ""}`}
                onClick={() => {
                  let valType = "text";
                  if (isArray) valType = "array";
                  else if (typeof value === "number") valType = "number";
                  else if (typeof value === "boolean") valType = "boolean";
                  
                  handleToggleResponseVariable(currentPath, valType);
                }}
              >
                {isVariableSelected ? (
                  <FiCheckSquare className={styles.checkboxIconActiveColor} size={14} />
                ) : (
                  <FiSquare size={14} />
                )}
                {isVariableSelected ? "Variable Active" : "Map Key"}
              </button>
            </div>
          </div>
          {hasChildren && renderResponsePayloadTreeNodes(value, currentPath)}
        </div>
      );
    });
  };

  const filteredWebhooks = useMemo(() => {
    return webhooks.filter((hook) => {
      const name = hook.name || "";
      const path = hook.endpointPath || "";
      return name.toLowerCase().includes(searchQuery.toLowerCase()) || path.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [webhooks, searchQuery]);

  return (
    <div className={styles.workflowsMainWorkspaceNode}>
      {!selectedWebhookId ? (
        <div className={styles.fullWidthListContainer}>
          <div className={styles.topControlDeckStripStrip}>
            <div className={styles.searchFilterInputBoxWrapper}>
              <FiSearch className={styles.searchInnerDecorativeIcon} size={16} />
              <input 
                type="text"
                className={styles.webhookSearchFieldInput}
                placeholder="Search webhooks by name or endpoint URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              type="button" 
              className={styles.globalAddWebhookActionBtn}
              onClick={handleCreateWebhook}
            >
              <FiPlus size={14} /> Add Receiver
            </button>
          </div>

          <div className={styles.centeredRegistryHeader}>
            <h4>Incoming Webhook Receivers ({filteredWebhooks.length})</h4>
            <p>Select a webhook receiver to configure its endpoint, security, and variable mappings for incoming data.</p>
          </div>

          <div className={styles.fullWidthCardsGrid}>
            {isLoading ? (
              <div style={{ padding: "40px", textAlign: "center", width: "100%" }}><FiLoader className={styles.spinIcon} size={24} /></div>
            ) : (
              filteredWebhooks.map((hook) => (
                <div 
                  key={hook.id} 
                  className={styles.largeWebhookDisplayCard}
                  onClick={() => setSelectedWebhookId(hook.id)}
                >
                  <div className={styles.cardHeaderTopMeta}>
                    <span className={`${styles.httpMethodPillBadge} ${styles.method_POST}`}>
                      POST
                    </span>
                    <span className={`${styles.categoryPillTagLabel} ${styles.Custom}`}>
                      Incoming
                    </span>
                    
                    <div className={styles.topCardActionsUnifiedCluster} onClick={(e) => e.stopPropagation()}>
                      <label className={styles.nativeSwitchToggleTrackLabel}>
                        <input 
                          type="checkbox" 
                          checked={hook.isActive} 
                          onChange={() => handleToggleActiveState(hook.id, hook.isActive)} 
                        />
                        <span className={styles.nativeSwitchToggleSliderNode}></span>
                      </label>

                      <button
                        type="button"
                        className={styles.topRightCardDeleteTriggerButton}
                        onClick={() => handleDeleteWebhook(hook.id)}
                        title="Delete this endpoint permanently"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h3 className={styles.webhookDisplayTitleName}>{hook.name || hook.provider}</h3>
                  <div className={styles.webhookCardTruncatedUrlCode}>{hook.endpointPath}</div>

                  <div className={styles.cardMetaFooterInfoRow}>
                    <span className={styles.variablesCounterSummaryPill}>
                      {hook.selectedVariables?.length || 0} Variables Mapped
                    </span>
                  </div>
                </div>
              ))
            )}
            
            {!isLoading && filteredWebhooks.length === 0 && (
              <div className={styles.emptyWebhookStatePlate}>
                <div className={styles.emptyStateIconCluster}>
                  <div className={styles.emptyStatePulseRing} />
                  <div className={styles.emptyStateIconCircle}>
                    <FiActivity size={28} strokeWidth={1.5} />
                  </div>
                  <div className={styles.emptyStateOrbitDot} style={{ top: "4px", right: "12px" }} />
                  <div className={styles.emptyStateOrbitDot} style={{ bottom: "6px", left: "8px" }} />
                </div>
                <h3 className={styles.emptyStateHeadline}>
                  No matching webhooks
                </h3>
                <p className={styles.emptyStateSubtext}>
                  Add an incoming webhook endpoint to receive payloads from external systems.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.fullWidthListContainer}>
          <div className={styles.editorTopNavigationBarStripLine} style={{ marginBottom: "24px" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                type="button" 
                className={styles.workbenchBackToListBtnLink}
                onClick={() => setSelectedWebhookId(null)}
              >
                <FiArrowLeft size={16} /> Back to Webhooks
              </button>
              <div className={styles.editingContextTitleBreadcrumb}>
                Settings / Incoming Webhooks / <span className={styles.activeLabelItemText}>{activeWebhook?.name}</span>
              </div>
            </div>
            <div className={styles.editorTopRightActions}>
              <button 
                type="button"
                className={styles.appleSaveActionBtn}
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? <FiLoader className={styles.spinIcon} size={14} /> : "Save Configuration"}
              </button>
            </div>
          </div>

          <div style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
            
            <div style={{ marginBottom: "24px" }}>
               <h5 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>Webhook Name</h5>
               <input 
                 type="text"
                 value={activeWebhook?.name || ""}
                 onChange={(e) => setWebhooks(prev => prev.map(h => h.id === selectedWebhookId ? { ...h, name: e.target.value } : h))}
                 style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "13px", outline: "none" }}
               />
            </div>

            <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h5 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>Endpoint URL</h5>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>Paste this URL into the external system (e.g., Kylas portal).</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", borderRadius: "6px", border: "1px solid #E2E8F0", overflow: "hidden", backgroundColor: "#FFFFFF" }}>
                  <span style={{ fontSize: "13px", color: "#64748B", backgroundColor: "#F1F5F9", padding: "10px 12px", borderRight: "1px solid #E2E8F0", userSelect: "none" }}>
                    {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/incoming/` : "/api/webhooks/incoming/"}
                  </span>
                  <input 
                    type="text"
                    value={(activeWebhook?.endpointPath || "").replace('/api/webhooks/incoming/', '')}
                    onChange={(e) => {
                      const cleanSlug = e.target.value.replace(/[^a-zA-Z0-9\-_/]/g, '');
                      const newPath = `/api/webhooks/incoming/${cleanSlug}`;
                      setWebhooks(prev => prev.map(h => h.id === selectedWebhookId ? { ...h, endpointPath: newPath } : h));
                    }}
                    placeholder="custom/path"
                    style={{ width: "200px", padding: "10px 12px", border: "none", fontSize: "13px", outline: "none", color: "#0F172A", fontWeight: "500" }}
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const url = typeof window !== 'undefined' ? `${window.location.origin}${activeWebhook?.endpointPath}` : activeWebhook?.endpointPath;
                    navigator.clipboard.writeText(url);
                    toast.success("Webhook URL copied to clipboard!");
                  }}
                  style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#0F172A", color: "white", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}
                >
                  <FiCopy size={14} /> Copy
                </button>
              </div>
            </div>

            <hr style={{ border: "0", borderTop: "1px solid #E2E8F0", margin: "0 0 24px 0" }} />

            <div style={{ marginBottom: "24px" }}>
               <h5 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "600", color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
                <FiShield /> Security & Authentication
               </h5>
               
               <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
                 <div style={{ flex: 1 }}>
                   <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Authentication Type</label>
                   <CustomDropdown 
                      options={[
                        { label: "No Authentication", value: "NO_AUTH" },
                        { label: "Bearer Token", value: "BEARER_TOKEN" }
                      ]}
                      selectedValue={activeWebhook?.authType || "NO_AUTH"}
                      onSelect={(val) => setWebhooks(prev => prev.map(h => h.id === selectedWebhookId ? { ...h, authType: val } : h))}
                    />
                 </div>

                 {activeWebhook?.authType === "BEARER_TOKEN" && (
                   <div style={{ flex: 2 }}>
                     <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Expected Token Secret</label>
                     <input 
                       type="text"
                       value={activeWebhook?.authToken || ""}
                       onChange={(e) => setWebhooks(prev => prev.map(h => h.id === selectedWebhookId ? { ...h, authToken: e.target.value } : h))}
                       placeholder="e.g. sk_live_123456789"
                       style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "13px", outline: "none" }}
                     />
                     <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "#64748B" }}>Incoming requests must include the header: <code>Authorization: Bearer {activeWebhook?.authToken || "..."}</code></p>
                   </div>
                 )}
               </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <label className={styles.nativeSwitchToggleTrackLabel}>
                  <input 
                    type="checkbox" 
                    checked={activeWebhook?.isTestMode || false} 
                    onChange={(e) => setWebhooks(prev => prev.map(h => h.id === selectedWebhookId ? { ...h, isTestMode: e.target.checked } : h))} 
                  />
                  <span className={styles.nativeSwitchToggleSliderNode}></span>
                </label>
                <div>
                  <span style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>Test Mode</span>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>Enable to record and display incoming payloads below.</span>
                </div>
              </div>
            </div>
          </div>

          {activeWebhook?.isTestMode && (
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h5 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600", color: "#0F172A" }}>Recent Test Payloads</h5>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>Showing the last 50 payloads received by this endpoint.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    type="button"
                    onClick={fetchLogs}
                    disabled={isFetchingLogs}
                    style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}
                  >
                    <FiRefreshCw size={12} className={isFetchingLogs ? styles.spinIcon : ""} /> Refresh
                  </button>
                  <button 
                    type="button"
                    onClick={handleClearLogs}
                    style={{ backgroundColor: "#FEE2E2", color: "#EF4444", border: "1px solid #FCA5A5", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}
                  >
                    Clear Logs
                  </button>
                </div>
              </div>

              {isFetchingLogs ? (
                <div style={{ textAlign: "center", padding: "20px" }}><FiLoader className={styles.spinIcon} size={20} color="#64748B" /></div>
              ) : logs.length === 0 ? (
                <div style={{ backgroundColor: "#F8FAFC", padding: "30px", textAlign: "center", borderRadius: "8px", border: "1px dashed #CBD5E1" }}>
                  <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>No payloads recorded yet. Send a test webhook to see it here.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {logs.map((log) => (
                    <div key={log.id} style={{ border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
                      <div style={{ backgroundColor: "#F8FAFC", padding: "10px 16px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#475569", fontWeight: "500" }}>
                        <span>Received at: {new Date(log.createdAt).toLocaleString()}</span>
                        <span style={{ color: "#3B82F6" }}>{log.id}</span>
                      </div>
                      <div style={{ padding: "16px", backgroundColor: "#0F172A", overflowX: "auto" }}>
                        <pre style={{ margin: 0, color: "#E2E8F0", fontSize: "12px", fontFamily: "monospace" }}>
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(log.payload), null, 2);
                            } catch (e) {
                              return log.payload;
                            }
                          })()}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {logs.length > 0 && (
                <div style={{ marginTop: "32px", borderTop: "1px solid #E2E8F0", paddingTop: "24px" }}>
                  <h5 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600", color: "#0F172A" }}>Payload Variable Mapping</h5>
                  <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748B" }}>Select nested keys from your most recent webhook payload to map them manually to your ecosystem configurations.</p>
                  <div style={{ backgroundColor: "#F8FAFC", padding: "16px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                    {(() => {
                      try {
                        const latestPayload = JSON.parse(logs[0].payload);
                        return renderResponsePayloadTreeNodes(latestPayload);
                      } catch(e) {
                        return <div style={{ color: "#EF4444", fontSize: "13px" }}>Could not parse recent payload to map variables.</div>;
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
