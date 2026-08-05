"use client";

import React, { useState, useEffect } from "react";
import { FiSave, FiCopy, FiLoader, FiShield, FiRefreshCw, FiCheckSquare, FiSquare } from "react-icons/fi";
import CustomDropdown from "@/components/ui/dropdown/dropdown";
import toast from "react-hot-toast";
import styles from "../WorkflowSettings/WorkflowSettings.module.css"; // Reuse existing styles

export default function IncomingWebhooks() {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Default values for a new setup
  const [authType, setAuthType] = useState("NO_AUTH");
  const [authToken, setAuthToken] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isTestMode, setIsTestMode] = useState(false);
  const [selectedVariables, setSelectedVariables] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);

  const fetchLogs = async () => {
    setIsFetchingLogs(true);
    try {
      const res = await fetch("/api/settings/incoming-webhooks/logs");
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
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/settings/incoming-webhooks");
        if (res.ok) {
          const data = await res.json();
          const kylasConfig = data.find(c => c.provider === "KYLAS");
          if (kylasConfig) {
            setConfig(kylasConfig);
            setAuthType(kylasConfig.authType);
            setAuthToken(kylasConfig.authToken || "");
            setIsActive(kylasConfig.isActive);
            setIsTestMode(kylasConfig.isTestMode || false);
            try {
              setSelectedVariables(typeof kylasConfig.selectedVariables === 'string' ? JSON.parse(kylasConfig.selectedVariables) : (kylasConfig.selectedVariables || []));
            } catch(e) {
              setSelectedVariables([]);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load incoming webhooks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConfig();
    fetchLogs();
  }, []);

  const handleToggleResponseVariable = (path, valueType = "text") => {
    const currentList = selectedVariables || [];
    const exists = currentList.find(item => item.path === path);
    let newList;
    if (exists) {
      newList = currentList.filter(item => item.path !== path);
    } else {
      const defaultName = path.split('.').pop() || "variable_name";
      newList = [...currentList, { path, customName: defaultName, type: valueType }];
    }
    setSelectedVariables(newList);
  };

  const renderResponsePayloadTreeNodes = (node, parentPath = "") => {
    if (typeof node !== "object" || node === null) return null;

    return Object.entries(node).map(([key, value]) => {
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      const isObject = typeof value === "object" && value !== null && !Array.isArray(value);
      const isArray = Array.isArray(value);
      const hasChildren = typeof value === "object" && value !== null;
      const isVariableSelected = selectedVariables?.some(v => v.path === currentPath);

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

  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to clear all test logs?")) return;
    try {
      const res = await fetch("/api/settings/incoming-webhooks/logs", { method: "DELETE" });
      if (res.ok) {
        setLogs([]);
        toast.success("Logs cleared successfully!");
      }
    } catch (error) {
      toast.error("Failed to clear logs");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/incoming-webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "KYLAS",
          endpointPath: "/api/webhooks/kylas",
          authType,
          authToken,
          isActive,
          isTestMode,
          selectedVariables
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

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/kylas` : '/api/webhooks/kylas';

  if (isLoading) {
    return <div style={{ padding: "40px", textAlign: "center" }}><FiLoader className={styles.spinIcon} size={24} /></div>;
  }

  return (
    <div className={styles.workflowsMainWorkspaceNode}>
      <div className={styles.fullWidthListContainer}>
        
        <div className={styles.centeredRegistryHeader} style={{ marginBottom: "24px" }}>
          <h4>Incoming Webhook Receiver</h4>
          <p>Configure security and retrieve the URL for systems like Kylas to push data to your portal.</p>
        </div>

        <div style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
          
          <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h5 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>Endpoint URL</h5>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>Paste this URL into the external system (e.g., Kylas portal).</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <code style={{ backgroundColor: "#FFFFFF", padding: "10px 16px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "13px", color: "#334155", userSelect: "all" }}>
                {webhookUrl}
              </code>
              <button 
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  toast.success("Webhook URL copied to clipboard!");
                }}
                style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#0F172A", color: "white", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}
              >
                <FiCopy size={14} /> Copy URL
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
                    selectedValue={authType}
                    onSelect={(val) => setAuthType(val)}
                  />
               </div>

               {authType === "BEARER_TOKEN" && (
                 <div style={{ flex: 2 }}>
                   <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Expected Token Secret</label>
                   <input 
                     type="text"
                     value={authToken}
                     onChange={(e) => setAuthToken(e.target.value)}
                     placeholder="e.g. sk_live_123456789"
                     style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "13px", outline: "none" }}
                   />
                   <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "#64748B" }}>Incoming requests must include the header: <code>Authorization: Bearer {authToken || "..."}</code></p>
                 </div>
               )}
             </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <label className={styles.nativeSwitchToggleTrackLabel}>
                <input 
                  type="checkbox" 
                  checked={isTestMode} 
                  onChange={(e) => setIsTestMode(e.target.checked)} 
                />
                <span className={styles.nativeSwitchToggleSliderNode}></span>
              </label>
              <div>
                <span style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>Test Mode</span>
                <span style={{ fontSize: "12px", color: "#64748B" }}>Enable to record and display incoming payloads below.</span>
              </div>
            </div>
            <button 
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#3B82F6", color: "white", border: "none", padding: "10px 24px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}
            >
              {isSaving ? <FiLoader className={styles.spinIcon} size={14} /> : <FiSave size={14} />} Save Configuration
            </button>
          </div>

        </div>

        {isTestMode && (
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
                <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>No payloads recorded yet. Send a test webhook from Kylas to see it here.</p>
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
    </div>
  );
}
