"use client";

import React, { useState } from "react";
import { 
  FiSearch, FiPlus, FiEye, FiEyeOff, 
  FiLayers, FiGlobe, FiTerminal, FiCheckSquare, FiSquare, 
  FiAlertTriangle, FiCheck, FiTrash2 
} from "react-icons/fi";
import CustomDropdown from "@/components/ui/dropdown/dropdown";
import Accordion from "@/components/ui/accordion/accordion";
import styles from "./WorkflowSettings.module.css";

export default function WorkflowSettings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [webhooks, setWebhooks] = useState([
    {
      id: "wk_01",
      name: "Kylas Won Deal Trigger Pipeline",
      category: "Kylas",
      method: "POST",
      endpointToken: "kylas_won_deals",
      destinationUrl: "https://api.kylas.io/v1/leads/webhook-receiver",
      isActive: true,
      activeSubTab: "headers",
      headers: [
        { id: "h_1", key: "Content-Type", value: "application/json", isHidden: false },
        { id: "h_2", key: "X-Kylas-App-Token", value: "live_crypto_7194xbc", isHidden: true }
      ],
      rawJson: '{\n  "lead": {\n    "id": 45102,\n    "displayName": "Rushish Mewada",\n    "dealValue": 75000\n  }\n}',
      tickedVariables: ["lead.id", "lead.displayName"],
      isFetchSimulated: true
    }
  ]);

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "Kylas", label: "Kylas" },
    { value: "CRM", label: "CRM" },
    { value: "Payment", label: "Payment" },
    { value: "Custom", label: "Custom" }
  ];

  const rowCategoryOptions = [
    { value: "Kylas", label: "Kylas" },
    { value: "CRM", label: "CRM" },
    { value: "Payment", label: "Payment" },
    { value: "Custom", label: "Custom" }
  ];

  const methodOptions = [
    { value: "POST", label: "POST" },
    { value: "PUT", label: "PUT" },
    { value: "GET", label: "GET" },
    { value: "PATCH", label: "PATCH" },
    { value: "DELETE", label: "DELETE" }
  ];

  const handleAddNewWebhookRule = () => {
    const newHook = {
      id: `wk_${Date.now()}`,
      name: "New Automation Webhook Rule",
      category: "Custom",
      method: "POST",
      endpointToken: `endpoint_slug_${Date.now().toString().slice(-4)}`,
      destinationUrl: "https://api.yourdomain.com/v1/endpoint",
      isActive: true,
      activeSubTab: "headers",
      headers: [{ id: `h_${Date.now()}`, key: "Content-Type", value: "application/json", isHidden: false }],
      rawJson: "{\n  \"example_property\": \"value\"\n}",
      tickedVariables: [],
      isFetchSimulated: false
    };
    setWebhooks([newHook, ...webhooks]);
  };

  const handleUpdateWebhookMeta = (id, field, value) => {
    setWebhooks(webhooks.map(h => h.id === id ? { ...h, [field]: value } : h));
  };

  const handleUpdateSubTab = (id, tabTarget) => {
    setWebhooks(webhooks.map(h => h.id === id ? { ...h, activeSubTab: tabTarget } : h));
  };

  const handleAddHeaderRow = (hookId) => {
    setWebhooks(webhooks.map(h => {
      if (h.id !== hookId) return h;
      return {
        ...h,
        headers: [...h.headers, { id: `h_${Date.now()}`, key: "", value: "", isHidden: false }]
      };
    }));
  };

  const handleUpdateHeaderRow = (hookId, headerId, field, value) => {
    setWebhooks(webhooks.map(h => {
      if (h.id !== hookId) return h;
      return {
        ...h,
        headers: h.headers.map(hdr => hdr.id === headerId ? { ...hdr, [field]: value } : hdr)
      };
    }));
  };

  const handleDeleteHeaderRow = (hookId, headerId) => {
    setWebhooks(webhooks.map(h => {
      if (h.id !== hookId) return h;
      return { ...h, headers: h.headers.filter(hdr => hdr.id !== headerId) };
    }));
  };

  const handleToggleTreeVariable = (hookId, pathStr) => {
    setWebhooks(webhooks.map(h => {
      if (h.id !== hookId) return h;
      const exists = h.tickedVariables.includes(pathStr);
      return {
        ...h,
        tickedVariables: exists 
          ? h.tickedVariables.filter(p => p !== pathStr)
          : [...h.tickedVariables, pathStr]
      };
    }));
  };

  const handleTriggerMockFetch = (hookId) => {
    setWebhooks(webhooks.map(h => h.id === hookId ? { ...h, isFetchSimulated: true } : h));
  };

  const handleSaveIndividualWebhookChanges = (hookObj) => {
    alert(`Webhook changes for "${hookObj.name}" compiled and saved successfully.`);
  };

  const filteredWebhooks = webhooks.filter(hook => {
    const matchesSearch = hook.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          hook.endpointToken.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || hook.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={styles.workflowsMainWorkspaceNode}>
      
      <div className={styles.topControlDeckStripStrip}>
        <div className={styles.searchFilterInputBoxWrapper}>
          <FiSearch className={styles.searchInnerDecorativeIcon} />
          <input 
            type="text" 
            placeholder="Search webhooks by name or routing slug..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.webhookSearchFieldInput}
          />
        </div>
        <div className={styles.categoryDropdownWrapperOverride}>
          <CustomDropdown 
            options={categoryOptions}
            selectedValue={categoryFilter}
            onSelect={(val) => setCategoryFilter(val)}
            icon={FiLayers}
          />
        </div>
        <button type="button" className={styles.globalAddWebhookActionBtn} onClick={handleAddNewWebhookRule}>
          <FiPlus size={14} />
          <span>Add Webhook Rule</span>
        </button>
      </div>

      <div className={styles.accordionVerticalScrollTrackCanvas}>
        {filteredWebhooks.map((hook) => {
          const accordionHeaderTitleObj = (
            <div className={styles.postmanAccordionHeaderRowLayout} onClick={(e) => e.stopPropagation()}>
              <span className={`${styles.httpMethodPillBadge} ${styles["method_" + hook.method]}`}>
                {hook.method}
              </span>
              <span className={styles.generatedUrlEndpointSlugReadout}>
                /api/workflows/execute/<code className={styles.codeTokenText}>{hook.endpointToken || "empty_slug"}</code>
              </span>
              <span className={`${styles.categoryPillTagLabel} ${styles[hook.category]}`}>
                {hook.category}
              </span>
              <div className={styles.headerRightToggleWrapper}>
                <label className={styles.nativeSwitchToggleTrackLabel} title="Toggle Active Execution Routing Status">
                  <input 
                    type="checkbox" 
                    checked={hook.isActive} 
                    onChange={(e) => handleUpdateWebhookMeta(hook.id, "isActive", e.target.checked)} 
                  />
                  <span className={styles.nativeSwitchToggleSliderNode} />
                </label>
              </div>
            </div>
          );

          return (
            <div key={hook.id} className={styles.accordionShellCardWrapperFrame}>
              <Accordion title={accordionHeaderTitleObj} defaultOpen={hook.id === "wk_01"}>
                <div className={styles.accordionInteriorFlexColumnContainer} onClick={(e) => e.stopPropagation()}>
                  
                  <div className={styles.postmanWorkspaceSplitLayoutGrid}>
                    
                    <div className={styles.leftPaneConfigurationCriteriaBox}>
                      <h4>Endpoint Routing Metadata</h4>
                      
                      <div className={styles.formInputGroupFieldElement}>
                        <label className={styles.fieldLabelTextPrimitive}>Webhook Display Identification Name</label>
                        <input 
                          type="text" 
                          value={hook.name} 
                          onChange={(e) => handleUpdateWebhookMeta(hook.id, "name", e.target.value)} 
                          className={styles.standardWorkspaceTextFieldInput}
                        />
                      </div>

                      <div className={styles.formInputGroupFieldElement}>
                        <label className={styles.fieldLabelTextPrimitive}>HTTP Request Execution Method</label>
                        <CustomDropdown 
                          options={methodOptions}
                          selectedValue={hook.method}
                          onSelect={(val) => handleUpdateWebhookMeta(hook.id, "method", val)}
                          icon={FiGlobe}
                        />
                      </div>

                      <div className={styles.formInputGroupFieldElement}>
                        <label className={styles.fieldLabelTextPrimitive}>Operational Profile Category</label>
                        <CustomDropdown 
                          options={rowCategoryOptions}
                          selectedValue={hook.category}
                          onSelect={(val) => handleUpdateWebhookMeta(hook.id, "category", val)}
                          icon={FiTerminal}
                        />
                      </div>

                      <div className={styles.formInputGroupFieldElement}>
                        <label className={styles.fieldLabelTextPrimitive}>Unique Router Endpoint Slug Token</label>
                        <div className={styles.inputPrefixIconWrapperNode}>
                          <FiGlobe className={styles.fieldInputIconAddonElement} />
                          <input 
                            type="text" 
                            value={hook.endpointToken} 
                            onChange={(e) => handleUpdateWebhookMeta(hook.id, "endpointToken", e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))} 
                            className={styles.standardWorkspaceTextFieldInputWithIcon}
                            placeholder="e.g. unique_slug_path"
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.rightPanePostmanWorkbenchConsoleBox}>
                      
                      <div className={styles.postmanTargetUrlInterfaceBlockBar}>
                        <div className={styles.methodSelectionPillReadOnly}>
                          {hook.method}
                        </div>
                        <input 
                          type="url" 
                          placeholder="Enter target external webhook destination endpoint URL (e.g. https://api.domain.com/receiver)" 
                          value={hook.destinationUrl}
                          onChange={(e) => handleUpdateWebhookMeta(hook.id, "destinationUrl", e.target.value)}
                          className={styles.postmanExternalDestinationUrlInputField}
                        />
                      </div>

                      <nav className={styles.postmanSubTabBarNavigationStrip}>
                        <button 
                          type="button" 
                          className={`${styles.postmanTabLinkBtnPrimes} ${hook.activeSubTab === "headers" ? styles.tabActiveStatePrime : ""}`}
                          onClick={() => handleUpdateSubTab(hook.id, "headers")}
                        >
                          Headers <span className={styles.tabNumericBadgeIndicatorCount}>{hook.headers.length}</span>
                        </button>
                        <button 
                          type="button" 
                          className={`${styles.postmanTabLinkBtnPrimes} ${hook.activeSubTab === "body" ? styles.tabActiveStatePrime : ""}`}
                          onClick={() => handleUpdateSubTab(hook.id, "body")}
                        >
                          Body (JSON)
                        </button>
                        <button 
                          type="button" 
                          className={`${styles.postmanTabLinkBtnPrimes} ${hook.activeSubTab === "fetch" ? styles.tabActiveStatePrime : ""}`}
                          onClick={() => handleUpdateSubTab(hook.id, "fetch")}
                        >
                          Response / Fetch Tree
                        </button>
                      </nav>

                      <div className={styles.postmanTabViewportWorkspaceInteriorBox}>
                        
                        {hook.activeSubTab === "headers" && (
                          <div className={styles.headersPaneWorkbenchTableGridLayout}>
                            <div className={styles.headersTableBannerRowTrack}>
                              <span className={styles.colHeaderKeyFieldText}>Header Field Key</span>
                              <span className={styles.colHeaderValueFieldText}>Parameter String Value</span>
                              <span className={styles.colHeaderUtilityFieldText}>Actions</span>
                            </div>
                            
                            <div className={styles.headersDataScrollTrackContainerRowsStack}>
                              {hook.headers.map((hdr) => (
                                <div key={hdr.id} className={styles.headerRecordInteractionRowFlexLine}>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. Authorization" 
                                    value={hdr.key}
                                    onChange={(e) => handleUpdateHeaderRow(hook.id, hdr.id, "key", e.target.value)}
                                    className={styles.headerTableMonospaceInputField}
                                  />
                                  <div className={styles.headerTablePasswordMaskInputWrapper}>
                                    <input 
                                      type={hdr.isHidden ? "password" : "text"} 
                                      placeholder="Value parameter string..." 
                                      value={hdr.value}
                                      onChange={(e) => handleUpdateHeaderRow(hook.id, hdr.id, "value", e.target.value)}
                                      className={styles.headerTableMonospaceInputField}
                                    />
                                    <button 
                                      type="button" 
                                      className={styles.inlineHeaderValuePasswordEyeToggleIndicatorBtn}
                                      onClick={() => handleUpdateHeaderRow(hook.id, hdr.id, "isHidden", !hdr.isHidden)}
                                    >
                                      {hdr.isHidden ? <FiEye size={12} /> : <FiEyeOff size={12} />}
                                    </button>
                                  </div>
                                  <button 
                                    type="button" 
                                    className={styles.headerRowDeleteTrashActionBtnElement}
                                    onClick={() => handleDeleteHeaderRow(hook.id, hdr.id)}
                                  >
                                    <FiTrash2 size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button type="button" className={styles.addNewHeaderParameterMatrixRowBtnLink} onClick={() => handleAddHeaderRow(hook.id)}>
                              <FiPlus size={12} /><span>Add Custom Header Line Property</span>
                            </button>
                          </div>
                        )}

                        {hook.activeSubTab === "body" && (
                          <div className={styles.bodyJSONPaneWorkbenchLayout}>
                            <div className={styles.postmanSubHeaderContextControlsStrip}>
                              <span className={styles.activePostmanRadioIndicatorDot}>raw</span>
                              <span className={styles.activePostmanRadioIndicatorDot}>JSON</span>
                            </div>
                            <textarea 
                              value={hook.rawJson} 
                              onChange={(e) => handleUpdateWebhookMeta(hook.id, "rawJson", e.target.value)}
                              className={styles.monospaceRawJsonWorkspaceTextareaField}
                              placeholder="{\n  'property': 'value'\n}"
                              rows={8}
                            />
                          </div>
                        )}

                        {hook.activeSubTab === "fetch" && (
                          <div className={styles.fetchResponsePaneWorkbenchLayout}>
                            <div className={styles.postmanResponseActionBarStripLine}>
                              <button type="button" className={styles.postmanRequestSendExecuteBtnLink} onClick={() => handleTriggerMockFetch(hook.id)}>
                                Send / Fetch Latest Payload
                              </button>
                              {hook.isFetchSimulated && (
                                <div className={styles.postmanResponseStatusReadoutFlexLine}>
                                  <span className={styles.statusOkIndicatorBadge}>Status: 200 OK</span>
                                  <span className={styles.statusTimeMetricText}>Time: 148 ms</span>
                                </div>
                              )}
                            </div>

                            {hook.isFetchSimulated ? (
                              <div className={styles.hierarchicalInteractiveTreeTerminalWindowBoxFrame}>
                                <div className={styles.treeNodeStructuralRowItemLine}>
                                  <span className={styles.objectEnclosureFolderLabelTextCode}>root</span>
                                </div>
                                
                                <div className={styles.treeNodeNestedIndentationTrackSubgroupContainerStack}>
                                  {[
                                    { name: "lead.id", short: "id", type: "number" },
                                    { name: "lead.displayName", short: "displayName", type: "string" },
                                    { name: "lead.dealValue", short: "dealValue", type: "number" }
                                  ].map((node) => {
                                    const isChecked = hook.tickedVariables.includes(node.name);
                                    return (
                                      <div key={node.name} className={styles.treeNodeLeafParameterRowFlexRowLayout}>
                                        <div className={styles.treeLeafKeyNameReadoutFlexRowLayout}>
                                          <span className={styles.treeLeafConnectorLinesLayoutGuideSpan}>├──</span>
                                          <span className={styles.primitiveKeyNameTextCode}>{node.short}</span>
                                          <span className={styles.primitiveTypeNameTextBadge}>{node.type}</span>
                                        </div>
                                        
                                        <button 
                                          type="button" 
                                          className={`${styles.checkboxInteractiveTreeGateToggleButtonLink} ${isChecked ? styles.gateActiveStateTextCode : ""}`}
                                          onClick={() => handleToggleTreeVariable(hook.id, node.name)}
                                        >
                                          {isChecked ? <FiCheckSquare size={14} className={styles.checkboxIconActiveColor} /> : <FiSquare size={14} />}
                                          <span>Template Variable</span>
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className={styles.unverifiedPayloadBlockingCalloutCard}>
                                <FiAlertTriangle size={20} className={styles.unverifiedIconNoticeColor} />
                                <div className={styles.unverifiedTextWrapColumn}>
                                  <h5>Verification Sequence Gated (Status Code Missing)</h5>
                                  <p>Variable parameter generation mappings remain completely locked down until an active, authentic HTTP Status 200 payload context initializes safely. Execute parsing by dispatching the fetch request simulation control above.</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    </div>

                  </div>

                  <div className={styles.postmanWorkspaceFooterRow}>
                    <button 
                      type="button" 
                      className={styles.saveWebhookChangesBtn} 
                      onClick={() => handleSaveIndividualWebhookChanges(hook)}
                    >
                      <FiCheck size={14} />
                      <span>Save Webhook Context</span>
                    </button>
                  </div>

                </div>
              </Accordion>
            </div>
          );
        })}
      </div>

    </div>
  );
}