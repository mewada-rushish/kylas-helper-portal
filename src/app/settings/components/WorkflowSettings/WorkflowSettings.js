"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  FiSearch, FiPlus, FiEye, FiEyeOff, FiX, FiActivity,
  FiLayers, FiGlobe, FiCheckSquare, FiSquare, 
  FiAlertTriangle, FiCheck, FiTrash2, FiArrowLeft
} from "react-icons/fi";
import CustomDropdown from "@/components/ui/dropdown/dropdown";
import CentralizedModal from "@/components/ui/modal/modal";
import SkeletonLoader from "@/components/ui/skeleton/skeleton";
import toast from "react-hot-toast";
import styles from "./WorkflowSettings.module.css";



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

export default function WorkflowSettings() {
  const [webhooks, setWebhooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  
  const [selectedWebhookId, setSelectedWebhookId] = useState(null);
  const [activeTab, setActiveTab] = useState("PARAMS"); 
  
  const [webhookToDelete, setWebhookToDelete] = useState(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [isSendingTest, setIsSendingTest] = useState(false);
  const [hasTested, setHasTested] = useState(false);
  const [testResponsePayload, setTestResponsePayload] = useState(null);
  const [testMetrics, setTestMetrics] = useState({ status: null, latency: null });

  const fetchWebhooks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings/webhooks");
      if (!res.ok) throw new Error("Failed to load webhooks");
      const data = await res.json();
      const parsedData = data.map(hook => ({
        ...hook,
        headers: hook.headers ? JSON.parse(hook.headers) : [],
        queryParams: hook.queryParams ? JSON.parse(hook.queryParams) : [],
        selectedVariables: hook.selectedVariables ? JSON.parse(hook.selectedVariables) : [],
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
      newHook.headers = newHook.headers ? JSON.parse(newHook.headers) : [];
      newHook.queryParams = newHook.queryParams ? JSON.parse(newHook.queryParams) : [];
      newHook.selectedVariables = newHook.selectedVariables ? JSON.parse(newHook.selectedVariables) : [];
      setWebhooks(prev => [newHook, ...prev]);
      setSelectedWebhookId(newHook.id);
      setHasTested(false);
      toast.success("Webhook created successfully!");
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

  const handleToggleResponseVariable = (jsonPath) => {
    if (!selectedWebhookId) return;
    setWebhooks(prev => prev.map(hook => {
      if (hook.id !== selectedWebhookId) return hook;
      const pathExists = hook.selectedVariables.includes(jsonPath);
      const updatedVars = pathExists 
        ? hook.selectedVariables.filter(v => v !== jsonPath)
        : [...hook.selectedVariables, jsonPath];
      return { ...hook, selectedVariables: updatedVars };
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
      setHasTested(true);
      setActiveTab("RESPONSE");
    } catch (err) {
      toast.error("Failed to execute webhook test");
      setTestMetrics({ status: "ERROR", latency: 0 });
      setTestResponsePayload({ error: err.message });
      setHasTested(true);
      setActiveTab("RESPONSE");
    } finally {
      setIsSendingTest(false);
    }
  };

  const renderResponsePayloadTreeNodes = (node, parentPath = "response") => {
    if (typeof node !== "object" || node === null) return null;

    return Object.entries(node).map(([key, value]) => {
      const currentPath = `${parentPath}.${key}`;
      const isObject = typeof value === "object" && value !== null;
      const isVariableSelected = activeWebhook?.selectedVariables?.includes(currentPath);

      return (
        <div key={currentPath} style={{ marginLeft: "16px", display: "flex", flexDirection: "column" }}>
          <div className={styles.treeNodeStructuralRowItemLine}>
            {isObject ? (
              <span className={styles.objectEnclosureFolderLabelTextCode}>❖ {key}:</span>
            ) : (
              <div className={styles.treeNodeLeafParameterRowFlexRowLayout}>
                <div className={styles.treeLeafKeyNameReadoutFlexRowLayout}>
                  <span className={styles.treeLeafConnectorLinesLayoutGuideSpan}>└─</span>
                  <span className={styles.primitiveKeyNameTextCode}>{key}:</span>
                  <span style={{ fontStyle: "italic", color: "#94A3B8", fontSize: "12px" }}>
                    &quot;{String(value)}&quot;
                  </span>
                  <span className={styles.primitiveTypeNameTextBadge}>{typeof value}</span>
                </div>
                
                <button 
                  type="button"
                  className={`${styles.checkboxInteractiveTreeGateToggleButtonLink} ${isVariableSelected ? styles.gateActiveStateTextCode : ""}`}
                  onClick={() => handleToggleResponseVariable(currentPath)}
                >
                  {isVariableSelected ? (
                    <FiCheckSquare className={styles.checkboxIconActiveColor} size={14} />
                  ) : (
                    <FiSquare size={14} />
                  )}
                  {isVariableSelected ? "Variable Active" : "Map Key"}
                </button>
              </div>
            )}
          </div>
          {isObject && renderResponsePayloadTreeNodes(value, currentPath)}
        </div>
      );
    });
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

          <div className={styles.splitWorkbenchFormAndControlsLayout}>
            <div className={styles.workbenchLeftSidebarConfigurationForm}>
              <h4>Webhook Attributes</h4>
              
              <div className={styles.formInputGroupFieldElement}>
                <span className={styles.fieldLabelTextPrimitive}>Configuration Title</span>
                <input 
                  type="text" 
                  className={styles.standardWorkspaceTextFieldInput}
                  value={activeWebhook?.name || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWebhooks(prev => prev.map(h => h.id === selectedWebhookId ? { ...h, name: val } : h));
                  }}
                />
              </div>

              <div className={styles.formInputGroupFieldElement}>
                <span className={styles.fieldLabelTextPrimitive}>Trigger Criteria Token</span>
                <input 
                  type="text" 
                  className={styles.standardWorkspaceTextFieldInput}
                  value={activeWebhook?.triggerType || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWebhooks(prev => prev.map(h => h.id === selectedWebhookId ? { ...h, triggerType: val.toUpperCase() } : h));
                  }}
                />
              </div>
            </div>

            <div className={styles.rightPanePostmanWorkbenchConsoleBox}>
              <div className={styles.postmanTargetUrlInterfaceBlockBar}>
                <select 
                  className={`${styles.methodSelectionPillDropdown} ${styles[`method_${activeWebhook?.method}`]}`}
                  value={activeWebhook?.method || "POST"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWebhooks(prev => prev.map(h => h.id === selectedWebhookId ? { ...h, method: val } : h));
                  }}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
                <input 
                  type="text"
                  className={styles.postmanExternalDestinationUrlInputField}
                  value={activeWebhook?.url || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWebhooks(prev => prev.map(h => h.id === selectedWebhookId ? { ...h, url: val } : h));
                  }}
                />
              </div>

              <div className={styles.postmanSubTabBarNavigationStrip}>
                <button 
                  type="button"
                  className={`${styles.postmanTabLinkBtnPrimes} ${activeTab === "PARAMS" ? styles.tabActiveStatePrime : ""}`}
                  onClick={() => setActiveTab("PARAMS")}
                >
                  Params 
                  <span className={styles.tabNumericBadgeIndicatorCount}>
                    {activeWebhook?.queryParams?.length || 0}
                  </span>
                </button>
                <button 
                  type="button"
                  className={`${styles.postmanTabLinkBtnPrimes} ${activeTab === "HEADERS" ? styles.tabActiveStatePrime : ""}`}
                  onClick={() => setActiveTab("HEADERS")}
                >
                  Headers
                  <span className={styles.tabNumericBadgeIndicatorCount}>
                    {activeWebhook?.headers?.length || 0}
                  </span>
                </button>
                <button 
                  type="button"
                  className={`${styles.postmanTabLinkBtnPrimes} ${activeTab === "BODY" ? styles.tabActiveStatePrime : ""}`}
                  onClick={() => setActiveTab("BODY")}
                >
                  Body Payload
                </button>
                <button 
                  type="button"
                  className={`${styles.postmanTabLinkBtnPrimes} ${activeTab === "VARIABLES" ? styles.tabActiveStatePrime : ""}`}
                  onClick={() => setActiveTab("VARIABLES")}
                >
                  Variables Mapped
                  <span className={styles.tabNumericBadgeIndicatorCount} style={{ background: "#E21F26", color: "#FFF" }}>
                    {activeWebhook?.selectedVariables?.length || 0}
                  </span>
                </button>
                <button 
                  type="button"
                  className={`${styles.postmanTabLinkBtnPrimes} ${activeTab === "RESPONSE" ? styles.tabActiveStatePrime : ""}`}
                  onClick={() => setActiveTab("RESPONSE")}
                >
                  Live Test Engine
                </button>
              </div>

              <div className={styles.postmanTabViewportWorkspaceInteriorBox}>
                
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

                {activeTab === "HEADERS" && (
                  <div className={styles.headersPaneWorkbenchTableGridLayout}>
                    <div className={styles.headersTableBannerRowTrack}>
                      <span className={styles.colHeaderKeyFieldText}>HTTP Header Specification Key</span>
                      <span className={styles.colHeaderValueFieldText}>Authorization Value Data Token</span>
                      <span className={styles.colHeaderUtilityFieldText}>Action</span>
                    </div>
                    <div className={styles.headersDataScrollTrackContainerRowsStack}>
                      {activeWebhook?.headers?.map((header, index) => (
                        <div key={index} className={styles.headerRecordInteractionRowFlexLine}>
                          <input 
                            type="text" 
                            className={styles.headerTableMonospaceInputField} 
                            placeholder="Authorization"
                            value={header.key}
                            onChange={(e) => handleUpdateFieldCollection("headers", index, "key", e.target.value)}
                          />
                          
                          <div className={styles.headerTablePasswordMaskInputWrapper}>
                            <input 
                              type={header.isSecret && !header.isVisible ? "password" : "text"} 
                              className={styles.headerTableMonospaceInputField}
                              placeholder="Bearer secret_token"
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
                        <h5>Bi-Directional Key Token Mapping System</h5>
                        <p>
                          Outgoing workflows interpolate tokens inside wrapped brackets while selected response paths extract matching keys instantly back into storage scopes.
                        </p>
                      </div>
                    </div>

                    <div className={styles.headersPaneWorkbenchTableGridLayout}>
                      <div className={styles.headersTableBannerRowTrack}>
                        <span className={styles.colHeaderKeyFieldText}>Extracted Response Target Node Address</span>
                        <span className={styles.colHeaderValueFieldText}>System Local Variable Context Mapping</span>
                      </div>
                      <div className={styles.headersDataScrollTrackContainerRowsStack}>
                        {!activeWebhook?.selectedVariables || activeWebhook.selectedVariables.length === 0 ? (
                          <div className={styles.emptyStateFallbackNoticeBlock}>
                            No execution paths mapped. Go to the Live Test Engine tab to capture keys.
                          </div>
                        ) : (
                          activeWebhook.selectedVariables.map((variablePath, idx) => (
                            <div key={idx} className={styles.headerRecordInteractionRowFlexLine}>
                              <input 
                                type="text" 
                                className={styles.headerTableMonospaceInputField} 
                                readOnly 
                                value={variablePath}
                              />
                              <span className={styles.linkedBindingConfirmationLabelBadge}>
                                Auto Mapped
                              </span>
                              <button 
                                type="button" 
                                className={styles.headerRowDeleteTrashActionBtnElement}
                                onClick={() => handleToggleResponseVariable(variablePath)}
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "RESPONSE" && (
                  <div className={styles.fetchResponsePaneWorkbenchLayout}>
                    <div className={styles.postmanResponseActionBarStripLine}>
                      <button 
                        type="button"
                        className={styles.postmanRequestSendExecuteBtnLink}
                        onClick={runWebhookTestSession}
                        disabled={isSendingTest}
                      >
                        {isSendingTest ? "Executing Actual Request..." : "⚡ Execute Live Webhook Test Request"}
                      </button>

                      {hasTested && !isSendingTest && (
                        <div className={styles.postmanResponseStatusReadoutFlexLine}>
                          Status: <span className={styles.statusOkIndicatorBadge} style={{ background: testMetrics.status >= 200 && testMetrics.status < 300 ? undefined : '#fde8e8', color: testMetrics.status >= 200 && testMetrics.status < 300 ? undefined : '#e02424' }}>
                            {testMetrics.status} {testMetrics.status >= 200 && testMetrics.status < 300 ? "SUCCESS" : "FAILED"}
                          </span>
                          Latency: <span className={styles.statusTimeMetricText}>{testMetrics.latency} ms</span>
                        </div>
                      )}
                    </div>

                    {isSendingTest && (
                      <div className={styles.testEngineLoaderBoxWrapperFrame}>
                        <FiGlobe className={styles.spinningGlobalGlobeLoaderIcon} size={24} />
                        <p>Parsing webhook rules matrices and executing mock endpoint handshake routes...</p>
                      </div>
                    )}

                    {hasTested && !isSendingTest && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <span className={styles.fieldLabelTextPrimitive}>
                          Click any active path key checkbox underneath to dynamically map parameters:
                        </span>
                        
                        <div className={styles.hierarchicalInteractiveTreeTerminalWindowBoxFrame}>
                          <div className={styles.treeNodeStructuralRowItemLine}>
                            <span className={styles.objectEnclosureFolderLabelTextCode}>📦 response: Root Object Node</span>
                          </div>
                          {renderResponsePayloadTreeNodes(testResponsePayload || {})}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

              <div className={styles.postmanWorkspaceFooterRow}>
                <button 
                  type="button"
                  className={styles.saveWebhookChangesBtn}
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/settings/webhooks/${activeWebhook.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(activeWebhook)
                      });
                      if (!res.ok) throw new Error("Failed to update webhook configurations");
                      toast.success(`Successfully updated and synchronized target configurations for ${activeWebhook?.name}`);
                    } catch (err) {
                      toast.error(err.message);
                    }
                  }}
                >
                  <FiCheck size={14} /> Update Webhook Specifications
                </button>
              </div>
            </div>

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
              toast.success("Webhook successfully deleted.");
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