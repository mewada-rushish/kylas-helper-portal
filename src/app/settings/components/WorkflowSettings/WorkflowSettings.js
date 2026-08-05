"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  FiSearch, FiPlus, FiEye, FiEyeOff, FiX, FiActivity,
  FiLayers, FiGlobe, FiCheckSquare, FiSquare, 
  FiAlertTriangle, FiCheck, FiTrash2, FiArrowLeft, FiLoader, FiCopy
} from "react-icons/fi";
import CustomDropdown from "@/components/ui/dropdown/dropdown";
import CentralizedModal from "@/components/ui/modal/modal";
import SkeletonLoader from "@/components/ui/skeleton/skeleton";
import toast from "react-hot-toast";
import styles from "./WorkflowSettings.module.css";


const generateSmartDefaultName = (path) => {
  const parts = path.split('.');
  let defaultName = parts.pop() || "variable_name";
  if (defaultName === 'id' && parts.length > 0) {
    let prev = parts.pop();
    if (!isNaN(prev) && parts.length > 0) {
        prev = parts.pop() + '_' + prev;
    }
    defaultName = prev + (prev.includes('_') ? '_id' : 'Id'); 
  } else if (!isNaN(defaultName) && parts.length > 0) {
    defaultName = parts.pop() + '_' + defaultName;
  }
  return defaultName;
};

const MOCK_RESPONSE_PAYLOAD_TREE = {
  status: "SUCCESS",
  code: 200,
  data: {
    integrationId: "int_992109231_xyz",
    processingTimeMs: 142,
    lead: {
      matchedDatabaseId: 889102,
      isDuplicate: false,
      routingDetails: {
        queueName: "crm_ingest_high_priority",
        workerNode: "node_us_east_4"
      }
    }
  },
  record: {
    sync_reference: "REF-2026-BBPS-001"
  }
};

const safeParseArray = (jsonString) => {
  if (!jsonString) return [];
  try {
    let parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export default function WorkflowSettings() {
  const [webhooks, setWebhooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  
  const [selectedWebhookId, setSelectedWebhookId] = useState(null);
  const [activeTab, setActiveTab] = useState("PARAMS"); 
  const [responseTab, setResponseTab] = useState("BODY");

  // Read from URL on mount and handle back button
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      setSelectedWebhookId(id || null);
      const tab = params.get('innerTab');
      if (tab) {
        setActiveTab(tab);
      }
    };
    
    // Check initially
    handleUrlChange();
    
    // Listen for back/forward buttons
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  // Sync to URL when state changes
  useEffect(() => {
    const url = new URL(window.location);
    const currentId = url.searchParams.get('id');
    const currentTab = url.searchParams.get('innerTab');
    
    let changed = false;
    
    if (selectedWebhookId && selectedWebhookId !== currentId) {
      url.searchParams.set('id', selectedWebhookId);
      changed = true;
    } else if (!selectedWebhookId && currentId) {
      url.searchParams.delete('id');
      url.searchParams.delete('innerTab'); // Clear tab when returning to list
      changed = true;
    }
    
    // Only sync tab if we have a webhook open
    if (selectedWebhookId && activeTab && activeTab !== currentTab) {
      url.searchParams.set('innerTab', activeTab);
      changed = true;
    } else if (selectedWebhookId && !activeTab && currentTab) {
      url.searchParams.delete('innerTab');
      changed = true;
    }

    if (changed) {
      window.history.pushState(null, '', url);
    }
  }, [selectedWebhookId, activeTab]);
  
  const [webhookToDelete, setWebhookToDelete] = useState(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [isSendingTest, setIsSendingTest] = useState(false);
  const [hasTested, setHasTested] = useState(false);
  const [testResponsePayload, setTestResponsePayload] = useState(null);
  const [testResponseHeaders, setTestResponseHeaders] = useState(null);
  const [testMetrics, setTestMetrics] = useState({ status: null, latency: null });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResponseExpanded, setIsResponseExpanded] = useState(false);
  const responseViewerRef = useRef(null);
  
  const [isAtBottom, setIsAtBottom] = useState(false);
  const bottomSentinelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting);
      },
      { threshold: 0 }
    );

    if (bottomSentinelRef.current) {
      observer.observe(bottomSentinelRef.current);
    }

    return () => {
      if (bottomSentinelRef.current) {
        observer.unobserve(bottomSentinelRef.current);
      }
    };
  }, [hasTested]);

  useEffect(() => {
    if (isResponseExpanded && responseViewerRef.current) {
      setTimeout(() => {
        responseViewerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [isResponseExpanded]);

  const fetchWebhooks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings/webhooks");
      if (!res.ok) throw new Error("Failed to load webhooks");
      const data = await res.json();
      const parsedData = data.map(hook => ({
        ...hook,
        headers: safeParseArray(hook.headers),
        queryParams: safeParseArray(hook.queryParams),
        selectedVariables: safeParseArray(hook.selectedVariables).map(v => typeof v === 'string' ? { path: v, customName: generateSmartDefaultName(v), type: 'text' } : v),
      }));
      setWebhooks(parsedData);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleCreateWebhook = async () => {
    try {
      const res = await fetch("/api/settings/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Custom Webhook Context API #${webhooks.length + 1}`,
          triggerType: "MANUAL_EVENT",
          category: "Custom",
          method: "POST",
          url: "https://api.domain.com/endpoint",
          headers: [{ key: "Content-Type", value: "application/json", isSecret: false, isVisible: true }],
          queryParams: [],
          bodyPayload: "{\n  \"status\": \"initial\"\n}",
          selectedVariables: []
        })
      });
      if (!res.ok) throw new Error("Failed to create webhook");
      const newHook = await res.json();
      newHook.headers = safeParseArray(newHook.headers);
      newHook.queryParams = safeParseArray(newHook.queryParams);
      newHook.selectedVariables = safeParseArray(newHook.selectedVariables).map(v => typeof v === 'string' ? { path: v, customName: generateSmartDefaultName(v), type: 'text' } : v);
      setWebhooks(prev => [newHook, ...prev]);
      setSelectedWebhookId(newHook.id);
      setHasTested(false);
      toast.success("Webhook created!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const categoryOptions = [
    { label: "All Categories", value: "ALL" },
    { label: "Kylas CRM", value: "Kylas" },
    { label: "Payment / ERP", value: "Payment" },
    { label: "Custom Hooks", value: "Custom" }
  ];

  const filteredWebhooks = useMemo(() => {
    return webhooks.filter((hook) => {
      const matchesSearch = 
        hook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hook.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hook.triggerType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "ALL" || hook.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [webhooks, searchQuery, categoryFilter]);

  const activeWebhook = useMemo(() => {
    return webhooks.find(h => h.id === selectedWebhookId) || null;
  }, [webhooks, selectedWebhookId]);

  const handleToggleActiveState = async (id, currentVal) => {
    setWebhooks(prev => prev.map(hook => 
      hook.id === id ? { ...hook, isActive: !currentVal } : hook
    ));
    try {
      const res = await fetch(`/api/settings/webhooks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentVal })
      });
      if (!res.ok) throw new Error("Failed to toggle status");
    } catch (err) {
      toast.error(err.message);
      setWebhooks(prev => prev.map(hook => 
        hook.id === id ? { ...hook, isActive: currentVal } : hook
      ));
    }
  };
  const handleUpdateFieldCollection = (type, index, field, value) => {
    if (!selectedWebhookId) return;
    setWebhooks(prev => prev.map(hook => {
      if (hook.id !== selectedWebhookId) return hook;
      const updatedList = [...hook[type]];
      updatedList[index] = { ...updatedList[index], [field]: value };
      return { ...hook, [type]: updatedList };
    }));
  };

  const handleAddFieldRow = (type) => {
    if (!selectedWebhookId) return;
    setWebhooks(prev => prev.map(hook => {
      if (hook.id !== selectedWebhookId) return hook;
      const newItem = type === "headers" 
        ? { key: "", value: "", isSecret: false, isVisible: true }
        : { key: "", value: "" };
      return { ...hook, [type]: [...hook[type], newItem] };
    }));
  };

  const handleRemoveFieldRow = (type, index) => {
    if (!selectedWebhookId) return;
    setWebhooks(prev => prev.map(hook => {
      if (hook.id !== selectedWebhookId) return hook;
      return { ...hook, [type]: hook[type].filter((_, i) => i !== index) };
    }));
  };

  const handleBodyPayloadChange = (value) => {
    if (!selectedWebhookId) return;
    setWebhooks(prev => prev.map(hook => 
      hook.id === selectedWebhookId ? { ...hook, bodyPayload: value } : hook
    ));
  };

  const handleToggleResponseVariable = (path, valueType = "text") => {
    if (!selectedWebhookId) return;
    const currentList = activeWebhook.selectedVariables || [];
    const exists = currentList.find(item => item.path === path);
    let newList;
    if (exists) {
      newList = currentList.filter(item => item.path !== path);
    } else {
      const defaultName = generateSmartDefaultName(path);
      newList = [...currentList, { path, customName: defaultName, type: valueType }];
    }
    
    setWebhooks(prev => prev.map(h => 
      h.id === selectedWebhookId ? { ...h, selectedVariables: newList } : h
    ));
  };

  const handleUpdateCustomVariableName = (path, newName) => {
    setWebhooks(prev => prev.map(h => {
      if (h.id !== selectedWebhookId) return h;
      const updatedList = (h.selectedVariables || []).map(v => 
        v.path === path ? { ...v, customName: newName } : v
      );
      return { ...h, selectedVariables: updatedList };
    }));
  };

  const handleUpdateCustomVariableType = (path, newType) => {
    setWebhooks(prev => prev.map(h => {
      if (h.id !== selectedWebhookId) return h;
      const updatedList = (h.selectedVariables || []).map(v => 
        v.path === path ? { ...v, type: newType } : v
      );
      return { ...h, selectedVariables: updatedList };
    }));
  };

  const runWebhookTestSession = async () => {
    if (!activeWebhook) return;
    setIsSendingTest(true);
    try {
      const res = await fetch(`/api/settings/webhooks/${activeWebhook.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeWebhook)
      });
      const result = await res.json();
      
      setTestMetrics({
        status: result.status || "ERROR",
        latency: result.executionTimeMs || 0
      });
      setTestResponsePayload(result.data || result);
      setTestResponseHeaders(result.headers || {});


      setHasTested(true);
      // Auto-expand removed per user request
    } catch (err) {
      toast.error("Failed to execute webhook test");
      setTestMetrics({ status: "ERROR", latency: 0 });
      setTestResponsePayload({ error: err.message });
      setTestResponseHeaders({});
      setHasTested(true);
      // Auto-expand removed per user request
    } finally {
      setIsSendingTest(false);
    }
  };

  const renderResponsePayloadTreeNodes = (node, parentPath = "response") => {
    if (typeof node !== "object" || node === null) return null;

    return Object.entries(node).map(([key, value]) => {
      const currentPath = `${parentPath}.${key}`;
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

  const authHeader = activeWebhook?.headers?.find(h => h.key.toLowerCase() === 'authorization');
  let authType = "No Auth";
  let bearerToken = "";
  let basicUser = "";
  let basicPass = "";
  if (authHeader) {
    if (authHeader.value.startsWith("Bearer ")) {
      authType = "Bearer Token";
      bearerToken = authHeader.value.replace("Bearer ", "");
    } else if (authHeader.value.startsWith("Basic ")) {
      authType = "Basic Auth";
      try {
        const decoded = atob(authHeader.value.replace("Basic ", ""));
        const [u, p] = decoded.split(":");
        basicUser = u || "";
        basicPass = p || "";
      } catch(e) {}
    }
  }

  const handleAuthChange = (type, token, user, pass) => {
    let newValue = "";
    if (type === "Bearer Token") newValue = `Bearer ${token}`;
    else if (type === "Basic Auth") newValue = `Basic ${btoa((user||"") + ":" + (pass||""))}`;
    
    setWebhooks(prev => prev.map(hook => {
      if (hook.id !== selectedWebhookId) return hook;
      let newHeaders = [...hook.headers];
      const idx = newHeaders.findIndex(h => h.key.toLowerCase() === 'authorization');
      if (type === "No Auth") {
        if (idx > -1) newHeaders.splice(idx, 1);
      } else {
        if (idx > -1) {
          newHeaders[idx].value = newValue;
        } else {
          newHeaders.push({ key: "Authorization", value: newValue, isSecret: true, isVisible: false });
        }
      }
      return { ...hook, headers: newHeaders };
    }));
  };

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
                placeholder="Search webhooks by name, endpoint URL or target criteria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.categoryDropdownWrapperOverride}>
              <CustomDropdown 
                options={categoryOptions}
                selectedValue={categoryFilter}
                onSelect={(val) => setCategoryFilter(val)}
              />
            </div>

            <button 
              type="button" 
              className={styles.globalAddWebhookActionBtn}
              onClick={handleCreateWebhook}
            >
              <FiPlus size={14} /> Add Webhook
            </button>
          </div>

          <div className={styles.centeredRegistryHeader}>
            <h4>Active Integration Webhooks ({filteredWebhooks.length})</h4>
            <p>Select a webhook integration card below to modify configuration parameters, request tokens, or trigger real-time sandbox test logs.</p>
          </div>

          <div className={styles.fullWidthCardsGrid}>
            {isLoading ? (
              <>
                <SkeletonLoader type="card" />
                <SkeletonLoader type="card" />
                <SkeletonLoader type="card" />
                <SkeletonLoader type="card" />
              </>
            ) : (
              filteredWebhooks.map((hook) => (
                <div 
                  key={hook.id} 
                className={styles.largeWebhookDisplayCard}
                onClick={() => {
                  setSelectedWebhookId(hook.id);
                  setHasTested(false);
                }}
              >
                <div className={styles.cardHeaderTopMeta}>
                  <span className={`${styles.httpMethodPillBadge} ${styles[`method_${hook.method}`]}`}>
                    {hook.method}
                  </span>
                  <span className={`${styles.categoryPillTagLabel} ${styles[hook.category]}`}>
                    {hook.category}
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
                      onClick={() => setWebhookToDelete(hook)}
                      title="Delete this webhook integration context permanently"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3 className={styles.webhookDisplayTitleName}>{hook.name}</h3>
                <div className={styles.webhookCardTruncatedUrlCode}>{hook.url}</div>

                <div className={styles.cardMetaFooterInfoRow}>
                  {hook.triggerType && (
                    <span className={styles.codeTokenText}>
                      Trigger: <strong>{hook.triggerType}</strong>
                    </span>
                  )}
                  <span className={styles.variablesCounterSummaryPill}>
                    {hook.selectedVariables?.length || 0} Variables Configured
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
                  {searchQuery || categoryFilter !== "ALL"
                    ? "No matching webhooks"
                    : "No webhooks configured yet"}
                </h3>
                <p className={styles.emptyStateSubtext}>
                  {searchQuery || categoryFilter !== "ALL"
                    ? "Try adjusting your search or category filter to find what you're looking for."
                    : "Webhooks let your portal push real-time events to external systems. Add your first endpoint to start routing Kylas triggers."}
                </p>
                {(!searchQuery && categoryFilter === "ALL") && (
                  <button
                    className={styles.emptyStateCta}
                    onClick={handleCreateWebhook}
                  >
                    <FiPlus size={15} />
                    Add Your First Webhook
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.fullWidthWorkbenchEditorPane}>
          <div className={styles.editorTopNavigationBarStripLine}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                type="button" 
                className={styles.workbenchBackToListBtnLink}
                onClick={() => setSelectedWebhookId(null)}
              >
                <FiArrowLeft size={16} /> Back to Webhook Registry
              </button>
              <div className={styles.editingContextTitleBreadcrumb}>
                Settings / Webhooks / <span className={styles.activeLabelItemText}>{activeWebhook?.name}</span>
              </div>
            </div>
            <div className={styles.editorTopRightActions}>
              <button 
                type="button"
                className={styles.appleSaveActionBtn}
                disabled={isUpdating}
                onClick={async () => {
                  setIsUpdating(true);
                  try {
                    const res = await fetch(`/api/settings/webhooks/${activeWebhook.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: activeWebhook.name,
                        triggerType: activeWebhook.triggerType,
                        method: activeWebhook.method,
                        url: activeWebhook.url,
                        headers: activeWebhook.headers,
                        queryParams: activeWebhook.queryParams,
                        bodyPayload: activeWebhook.bodyPayload,
                        selectedVariables: activeWebhook.selectedVariables
                      })
                    });
                    if (!res.ok) throw new Error("Failed to save changes");
                    toast.success("Webhook saved!");
                  } catch (err) {
                    toast.error(err.message);
                  } finally {
                    setIsUpdating(false);
                  }
                }}
              >
                {isUpdating ? <FiLoader className={styles.spinIcon} size={14} /> : "Save Changes"}
              </button>
            </div>
          </div>

          <div className={styles.unifiedAppleEditorLayout}>
            
            <div className={styles.applePropertiesCard}>
              <div className={styles.applePropertyRow}>
                <span className={styles.applePropertyLabel}>Title</span>
                <input 
                  type="text" 
                  className={styles.applePropertyInput}
                  value={activeWebhook?.name || ""}
                  placeholder="Webhook Name"
                  onChange={(e) => {
                    const val = e.target.value;
                    setWebhooks(prev => prev.map(h => h.id === selectedWebhookId ? { ...h, name: val } : h));
                  }}
                />
              </div>
              <div className={styles.applePropertyDivider} />
              <div className={styles.applePropertyRow}>
                <span className={styles.applePropertyLabel}>Trigger</span>
                <input 
                  type="text" 
                  className={styles.applePropertyInput}
                  value={activeWebhook?.triggerType || ""}
                  placeholder="TRIGGER_EVENT_NAME"
                  onChange={(e) => {
                    const val = e.target.value;
                    setWebhooks(prev => prev.map(h => h.id === selectedWebhookId ? { ...h, triggerType: val.toUpperCase() } : h));
                  }}
                />
              </div>
              <div className={styles.applePropertyDivider} />
              <div className={styles.applePropertyRow}>
                <span className={styles.applePropertyLabel}>Status</span>
                <div className={styles.applePropertyToggleWrapper}>
                  <label className={styles.nativeSwitchToggleTrackLabel}>
                    <input 
                      type="checkbox" 
                      checked={activeWebhook?.isActive || false} 
                      onChange={() => handleToggleActiveState(activeWebhook.id, activeWebhook.isActive)} 
                    />
                    <span className={styles.nativeSwitchToggleSliderNode}></span>
                  </label>
                  <span className={styles.appleToggleStatusText}>
                    {activeWebhook?.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.safariAddressBarContainer}>
              <div className={styles.safariMethodDropdown}>
                <CustomDropdown 
                  options={[
                    { label: "GET", value: "GET" },
                    { label: "POST", value: "POST" },
                    { label: "PUT", value: "PUT" },
                    { label: "DELETE", value: "DELETE" },
                    { label: "PATCH", value: "PATCH" }
                  ]}
                  selectedValue={activeWebhook?.method || "POST"}
                  onSelect={(val) => {
                    setWebhooks(prev => prev.map(h => h.id === selectedWebhookId ? { ...h, method: val } : h));
                  }}
                  triggerClassName={styles.safariDropdownTrigger}
                />
              </div>
              <div className={styles.safariUrlInputWrapper}>
                <FiGlobe className={styles.safariUrlIcon} size={14} />
                <input 
                  type="text"
                  className={styles.safariUrlInput}
                  placeholder="https://api.example.com/webhook"
                  value={activeWebhook?.url || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWebhooks(prev => prev.map(h => h.id === selectedWebhookId ? { ...h, url: val } : h));
                  }}
                />
              </div>
              <button 
                type="button"
                className={styles.safariSendBtn}
                onClick={runWebhookTestSession}
                disabled={isSendingTest}
              >
                {isSendingTest ? <FiLoader className={styles.spinIcon} size={16} /> : "Send"}
              </button>
            </div>

            <div className={styles.macOsSegmentedControlContainer}>
              <div className={styles.macOsSegmentedControlBackground}>
                <button 
                  className={`${styles.segmentBtn} ${activeTab === "PARAMS" ? styles.segmentActive : ""}`}
                  onClick={() => setActiveTab("PARAMS")}
                >
                  Params {activeWebhook?.queryParams?.length > 0 && <span className={styles.segmentBadge}>{activeWebhook.queryParams.length}</span>}
                </button>
                <button 
                  className={`${styles.segmentBtn} ${activeTab === "AUTH" ? styles.segmentActive : ""}`}
                  onClick={() => setActiveTab("AUTH")}
                >
                  Authorization
                </button>
                <button 
                  className={`${styles.segmentBtn} ${activeTab === "HEADERS" ? styles.segmentActive : ""}`}
                  onClick={() => setActiveTab("HEADERS")}
                >
                  Headers {activeWebhook?.headers?.length > 0 && <span className={styles.segmentBadge}>{activeWebhook.headers.length}</span>}
                </button>
                <button 
                  className={`${styles.segmentBtn} ${activeTab === "BODY" ? styles.segmentActive : ""}`}
                  onClick={() => setActiveTab("BODY")}
                >
                  Body
                </button>
                <button 
                  className={`${styles.segmentBtn} ${activeTab === "VARIABLES" ? styles.segmentActive : ""}`}
                  onClick={() => setActiveTab("VARIABLES")}
                >
                  Variables Mapped {activeWebhook?.selectedVariables?.length > 0 && <span className={styles.segmentBadge}>{activeWebhook.selectedVariables.length}</span>}
                </button>
              </div>
            </div>

            <div className={styles.macOsTabsContentArea}>
              {activeTab === "PARAMS" && (
                <div className={styles.headersPaneWorkbenchTableGridLayout}>
                  <div className={styles.headersTableBannerRowTrack}>
                    <span className={styles.colHeaderKeyFieldText}>URL Parameter Key</span>
                    <span className={styles.colHeaderValueFieldText}>Dynamic Context / Literal Value</span>
                    <span className={styles.colHeaderUtilityFieldText}>Action</span>
                  </div>
                  <div className={styles.headersDataScrollTrackContainerRowsStack}>
                    {activeWebhook?.queryParams?.map((param, index) => (
                      <div key={index} className={styles.headerRecordInteractionRowFlexLine}>
                        <input 
                          type="text" 
                          className={styles.headerTableMonospaceInputField} 
                          placeholder="e.g. leadSource"
                          value={param.key}
                          onChange={(e) => handleUpdateFieldCollection("queryParams", index, "key", e.target.value)}
                        />
                        <input 
                          type="text" 
                          className={styles.headerTableMonospaceInputField} 
                          style={{ flex: "1" }}
                          placeholder="e.g. {{lead.source}}"
                          value={param.value}
                          onChange={(e) => handleUpdateFieldCollection("queryParams", index, "value", e.target.value)}
                        />
                        <button 
                          type="button" 
                          className={styles.headerRowDeleteTrashActionBtnElement}
                          onClick={() => handleRemoveFieldRow("queryParams", index)}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    type="button" 
                    className={styles.addNewHeaderParameterMatrixRowBtnLink}
                    onClick={() => handleAddFieldRow("queryParams")}
                  >
                    <FiPlus size={12} /> Add Query Parameter Row
                  </button>
                </div>
              )}

              {activeTab === "AUTH" && (
                <div className={styles.authTabWrapperCard}>
                  <div className={styles.authTabSplitLayout}>
                    <div className={styles.authTabLeftColumn}>
                      <span className={styles.authTypeLabelSmall}>TYPE</span>
                      <div style={{ width: '200px' }}>
                        <CustomDropdown 
                          options={[
                            { label: "No Auth", value: "No Auth" },
                            { label: "Bearer Token", value: "Bearer Token" },
                            { label: "Basic Auth", value: "Basic Auth" }
                          ]}
                          selectedValue={authType}
                          onSelect={(val) => handleAuthChange(val, bearerToken, basicUser, basicPass)}
                        />
                      </div>
                    </div>
                    
                    <div className={styles.authTabRightColumn}>
                      {authType === "No Auth" && (
                        <div className={styles.authNoAuthText}>
                          This request does not use any authorization.
                        </div>
                      )}
                      
                      {authType === "Bearer Token" && (
                        <div className={styles.formInputGroupFieldElement}>
                          <span className={styles.fieldLabelTextPrimitive}>Token</span>
                          <input 
                            type="text" 
                            className={styles.standardWorkspaceTextFieldInput}
                            placeholder="Token"
                            value={bearerToken}
                            onChange={(e) => handleAuthChange("Bearer Token", e.target.value, basicUser, basicPass)}
                          />
                        </div>
                      )}

                      {authType === "Basic Auth" && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div className={styles.formInputGroupFieldElement}>
                            <span className={styles.fieldLabelTextPrimitive}>Username</span>
                            <input 
                              type="text" 
                              className={styles.standardWorkspaceTextFieldInput}
                              placeholder="Username"
                              value={basicUser}
                              onChange={(e) => handleAuthChange("Basic Auth", bearerToken, e.target.value, basicPass)}
                            />
                          </div>
                          <div className={styles.formInputGroupFieldElement}>
                            <span className={styles.fieldLabelTextPrimitive}>Password</span>
                            <input 
                              type="password" 
                              className={styles.standardWorkspaceTextFieldInput}
                              placeholder="Password"
                              value={basicPass}
                              onChange={(e) => handleAuthChange("Basic Auth", bearerToken, basicUser, e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "HEADERS" && (
                <div className={styles.headersPaneWorkbenchTableGridLayout}>
                  <div className={styles.headersTableBannerRowTrack}>
                    <span className={styles.colHeaderKeyFieldText}>Key</span>
                    <span className={styles.colHeaderValueFieldText}>Value</span>
                    <span className={styles.colHeaderUtilityFieldText}>Action</span>
                  </div>
                  <div className={styles.headersDataScrollTrackContainerRowsStack}>
                    {activeWebhook?.headers?.map((header, index) => (
                      <div key={index} className={styles.headerRecordInteractionRowFlexLine}>
                        <input 
                          type="text" 
                          className={styles.headerTableMonospaceInputField} 
                          placeholder="Key"
                          value={header.key}
                          onChange={(e) => handleUpdateFieldCollection("headers", index, "key", e.target.value)}
                        />
                        
                        <div className={styles.headerTablePasswordMaskInputWrapper}>
                          <input 
                            type={header.isSecret && !header.isVisible ? "password" : "text"} 
                            className={styles.headerTableMonospaceInputField}
                            placeholder="Value"
                            value={header.value}
                            onChange={(e) => handleUpdateFieldCollection("headers", index, "value", e.target.value)}
                          />
                          {header.isSecret && (
                            <button 
                              type="button" 
                              className={styles.inlineHeaderValuePasswordEyeToggleIndicatorBtn}
                              onClick={() => handleUpdateFieldCollection("headers", index, "isVisible", !header.isVisible)}
                            >
                              {header.isVisible ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                            </button>
                          )}
                        </div>

                        <label className={styles.inlineCheckboxContainerItemWrap}>
                          <input 
                            type="checkbox" 
                            checked={header.isSecret || false} 
                            onChange={(e) => handleUpdateFieldCollection("headers", index, "isSecret", e.target.checked)}
                          /> Mask
                        </label>

                        <button 
                          type="button" 
                          className={styles.headerRowDeleteTrashActionBtnElement}
                          onClick={() => handleRemoveFieldRow("headers", index)}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    type="button" 
                    className={styles.addNewHeaderParameterMatrixRowBtnLink}
                    onClick={() => handleAddFieldRow("headers")}
                  >
                    <FiPlus size={12} /> Add Custom Header Entity
                  </button>
                </div>
              )}

              {activeTab === "BODY" && (
                <div className={styles.bodyJSONPaneWorkbenchLayout}>
                  <div className={styles.postmanSubHeaderContextControlsStrip}>
                    <span className={styles.activePostmanRadioIndicatorDot}>raw JSON text configuration data</span>
                  </div>
                  <textarea 
                    className={styles.monospaceRawJsonWorkspaceTextareaField}
                    rows={12}
                    value={activeWebhook?.bodyPayload || ""}
                    onChange={(e) => handleBodyPayloadChange(e.target.value)}
                  />
                </div>
              )}

              {activeTab === "VARIABLES" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className={styles.unverifiedPayloadBlockingCalloutCard}>
                    <FiAlertTriangle className={styles.unverifiedIconNoticeColor} size={18} />
                    <div className={styles.unverifiedTextWrapColumn}>
                      <h5>Variables Mapped</h5>
                      <p>
                        Once you test the webhook successfully, you can map response fields to custom variable names inside the Response window below.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", backgroundColor: "#F8FAFC", padding: "16px", borderRadius: "8px", border: "1px solid #E2E8F0", marginTop: "16px" }}>
                    {!activeWebhook?.selectedVariables || activeWebhook.selectedVariables.length === 0 ? (
                      <div className={styles.emptyStateFallbackNoticeBlock}>
                        No execution paths mapped. Check the response pane below to map paths.
                      </div>
                    ) : (
                      activeWebhook.selectedVariables.map((variableObj, idx) => (
                        <div key={idx} className={styles.treeNodeStructuralRowItemLine}>
                          <div className={styles.treeNodeLeafParameterRowFlexRowLayout}>
                            <div className={styles.treeLeafKeyNameReadoutFlexRowLayout}>
                              <span className={styles.treeLeafConnectorLinesLayoutGuideSpan}>└─</span>
                              <span className={styles.primitiveKeyNameTextCode}>{variableObj.path}:</span>
                              <span className={styles.primitiveTypeNameTextBadge}>{(variableObj.type || "TEXT").toUpperCase()}</span>
                            </div>
                            
                            <div style={{ flexGrow: 1, borderBottom: "1px dashed #CBD5E1", margin: "0 16px" }} />
                            
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <input 
                                type="text"
                                value={variableObj.customName || ""}
                                placeholder="Custom Variable Name"
                                onChange={(e) => handleUpdateCustomVariableName(variableObj.path, e.target.value)}
                                style={{ padding: "6px 10px", borderRadius: "4px", border: "1px solid #CBD5E1", fontSize: "12px", outline: "none", width: "160px" }}
                              />
                              <button 
                                type="button" 
                                onClick={() => handleToggleResponseVariable(variableObj.path)} 
                                style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", borderRadius: "4px" }} 
                                title="Remove mapping"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {hasTested && (
              <div 
                className={`${styles.macOsResponseViewerContainer} ${(!isResponseExpanded && !isAtBottom) ? styles.stickyViewer : ''}`} 
                ref={responseViewerRef}
              >
                <div 
                  className={styles.responseTabBarPane}
                  onClick={() => setIsResponseExpanded(!isResponseExpanded)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.macOsSegmentedControlBackground} onClick={(e) => e.stopPropagation()}>
                    <button 
                      className={`${styles.segmentBtn} ${responseTab === "BODY" ? styles.segmentActive : ""}`}
                      onClick={() => { setResponseTab("BODY"); setIsResponseExpanded(true); }}
                    >
                      Body
                    </button>
                    <button 
                      className={`${styles.segmentBtn} ${responseTab === "HEADERS" ? styles.segmentActive : ""}`}
                      onClick={() => { setResponseTab("HEADERS"); setIsResponseExpanded(true); }}
                    >
                      Headers
                    </button>
                  </div>
                  <div className={styles.responseMetricsGroup}>
                    <span>Status: <span className={testMetrics.status === 200 ? styles.statusOk : styles.statusError}>
                      {testMetrics.status}
                    </span></span>
                    <span className={styles.latencyText}>{testMetrics.latency} ms</span>
                  </div>
                </div>
                
                {isResponseExpanded && (
                  <div className={styles.responseBodyViewer}>
                  {responseTab === "BODY" && (
                    <div className={styles.fetchResponsePaneWorkbenchLayout}>
                      <div className={styles.hierarchicalInteractiveTreeTerminalWindowBoxFrame}>
                        {typeof testResponsePayload === "object" && testResponsePayload !== null ? (
                          renderResponsePayloadTreeNodes(testResponsePayload)
                        ) : (
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#0F172A', fontSize: '13px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace' }}>
                            {String(testResponsePayload || "No response body returned")}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}
                  {responseTab === "HEADERS" && (
                    <div className={styles.fetchResponsePaneWorkbenchLayout}>
                      <div className={styles.hierarchicalInteractiveTreeTerminalWindowBoxFrame}>
                        {testResponseHeaders && Object.keys(testResponseHeaders).length > 0 ? (
                          <div style={{ padding: "8px 16px" }}>
                            {Object.entries(testResponseHeaders).map(([key, value]) => (
                              <div key={key} style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}>
                                <span style={{ fontWeight: 600, width: '250px', color: '#0F172A', fontSize: '13px' }}>{key}</span>
                                <span style={{ color: '#475569', fontSize: '13px', wordBreak: 'break-all', flex: 1 }}>{value}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ color: '#94A3B8', fontSize: '13px', padding: '16px' }}>No headers returned</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>
            )}
            {/* Sentinel element to track if we've scrolled to the bottom of the container */}
            <div ref={bottomSentinelRef} style={{ height: '1px', width: '100%' }}></div>
          </div>
        </div>
      )}

      {/* High-Assurance Destructive Confirm Action Modal Platform Overlay */}
      <CentralizedModal
        isOpen={webhookToDelete !== null}
        onClose={() => {
          setWebhookToDelete(null);
          setDeleteConfirmationText("");
          setIsDeleting(false);
        }}
        type="alert"
        variant="destructive"
        size="md"
        icon={<FiAlertTriangle size={20} />}
        title="Confirm Deletion"
        primaryAction={{
          label: "Delete Webhook",
          loadingLabel: "Deleting...",
          icon: <FiTrash2 size={14} />,
          variant: "destructive",
          loading: isDeleting,
          disabled: deleteConfirmationText !== webhookToDelete?.name,
          onClick: async () => {
            setIsDeleting(true);
            try {
              const res = await fetch(`/api/settings/webhooks/${webhookToDelete.id}`, {
                method: "DELETE"
              });
              if (!res.ok) throw new Error("Failed to delete webhook");
              setWebhooks(prev => prev.filter(h => h.id !== webhookToDelete.id));
              setWebhookToDelete(null);
              setDeleteConfirmationText("");
              toast.success("Webhook deleted.");
            } catch (err) {
              toast.error(err.message);
            } finally {
              setIsDeleting(false);
            }
          }
        }}
        secondaryAction={{
          label: "Cancel",
          icon: <FiX size={14} />,
          onClick: () => {
            setWebhookToDelete(null);
            setDeleteConfirmationText("");
            setIsDeleting(false);
          }
        }}
      >
        <div className={styles.modalDeletionSafetyBodyScopeBox}>
          <p className={styles.modalDeletionSafetyDescription}>
            This action is irreversible. To confirm, type the webhook name below.
          </p>
          <div className={styles.modalVerificationTargetCodeBadgeReadout}>
            {webhookToDelete?.name}
          </div>
          <div className={styles.formInputGroupFieldElement} style={{ gap: "6px" }}>
            <span className={styles.fieldLabelTextPrimitive} style={{ color: "#475569" }}>
              Webhook Name
            </span>
            <input
              type="text"
              className={styles.standardWorkspaceTextFieldInput}
              style={{ borderColor: deleteConfirmationText === webhookToDelete?.name ? "#10B981" : "#CBD5E1" }}
              placeholder="Type the webhook name to confirm"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      </CentralizedModal>

    </div>
  );
}