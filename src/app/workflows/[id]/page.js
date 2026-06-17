"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  FiZap, FiGitBranch, FiPlayCircle, FiSave, FiTrash2, 
  FiLayout, FiCreditCard, FiSettings, FiArrowLeft, FiClock, 
  FiMove, FiGrid, FiPlus, FiList, FiCheckCircle, FiAlertCircle,
  FiCode, FiChevronDown, FiFileText
} from "react-icons/fi";
import Sidebar from "@/components/layout/sidebar/sidebar";
import AdminButton from "@/components/ui/button/button";
import Dropdown from "@/components/ui/dropdown/dropdown";
import styles from "./workflows.module.css";

const TRIGGER_FIELDS = [
  { value: "payload.city", label: "Lead City" },
  { value: "payload.source", label: "Lead Source" },
  { value: "payload.estimatedValue", label: "Estimated Value (INR)" },
  { value: "payload.status", label: "Lead Status" }
];

const OPERATOR_OPTIONS = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
  { value: "greater_than", label: "Greater Than (>)" }
];

const ACTION_OPTIONS = [
  { value: "update_owner", label: "Kylas: Assign Owner" },
  { value: "create_task", label: "Kylas: Create Task" },
  { value: "send_whatsapp", label: "WhatsApp: Broadcast Alert" }
];

const MOCK_VERSIONS = [
  { versionId: "v3", timestamp: "2026-06-17T11:00:00Z", description: "Canvas Framework Migration - Free Form", Author: "Rushish Mewada" },
  { versionId: "v2", timestamp: "2026-06-17T10:15:00Z", description: "Auto-saved Blueprint State", Author: "System Engine" }
];

const INITIAL_LOGS = [
  {
    logId: "log_9921",
    timestamp: "2026-06-17T12:04:15Z",
    event: "lead.created",
    status: "success",
    incomingPayload: { leadId: 54921, firstName: "Manoj", lastName: "Sharma", city: "Mumbai", phone: "+919876543210", source: "Website Landing Page" },
    passedData: { action: "update_owner", assignedOwnerId: "usr_mumbai_01", apiResponseStatus: 200, assignedTeam: "Mumbai Prime Sales Team" }
  },
  {
    logId: "log_9918",
    timestamp: "2026-06-17T11:42:10Z",
    event: "lead.created",
    status: "failed",
    incomingPayload: { leadId: 54918, firstName: "Amit", lastName: "Patel", city: "Unknown", phone: "+919999999999", source: "Offline Seminar" },
    passedData: { action: "update_owner", error: "400 Bad Request - Missing valid routing parameter 'city'", failedNodeId: "router_1" }
  }
];

export default function WorkflowCanvasEngine() {
  const router = useRouter();
  const params = useParams();

  const [nodes, setNodes] = useState([
    { id: "node_1", type: "trigger", title: "Workflow Trigger", x: 60, y: 180, event: "lead.created" },
    { id: "node_2", type: "condition", title: "Hybrid Evaluation Switch", x: 420, y: 100, operator: "HYBRID", rules: [{ field: "payload.city", operator: "equals", value: "Mumbai" }] },
    { id: "node_3", type: "action", title: "Kylas Action", x: 820, y: 120, actionType: "update_owner", targetKey: "ownerId", targetValue: "usr_mumbai_01" }
  ]);

  const [edges, setEdges] = useState([
    { id: "edge_1", from: "node_1", to: "node_2", label: "On Trigger Fired" },
    { id: "edge_2", from: "node_2", to: "node_3", label: "Condition Passed" }
  ]);

  const [activeTab, setActiveTab] = useState("builder");
  const [saveStatus, setSaveStatus] = useState("All changes saved");
  const canvasRef = useRef(null);

  // Lists Data States
  const [logs] = useState(INITIAL_LOGS);
  const [selectedLog, setSelectedLog] = useState(null);

  // --- INTERACTION & VECTOR LINE STATES ---
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState({ active: false, startNodeId: null, startPlugType: null, x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

  useEffect(() => {
    if (nodes.length === 0) return;
    setSaveStatus("Compiling node modifications...");
    const debounceTimer = setTimeout(() => {
      setSaveStatus("Auto-saved to draft");
    }, 1500);
    return () => clearTimeout(debounceTimer);
  }, [nodes, edges]);

  // --- GLOBAL MOUSE EVENT ENGINE FOR FLAWLESS DRAG & DROP ---
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!canvasRef.current) return;
      const canvasBounds = canvasRef.current.getBoundingClientRect();
      const mouseXInCanvas = e.clientX - canvasBounds.left;
      const mouseYInCanvas = e.clientY - canvasBounds.top;

      if (draggingNodeId) {
        const newX = Math.max(0, Math.min(canvasBounds.width - 300, mouseXInCanvas - dragOffset.x));
        const newY = Math.max(0, Math.min(canvasBounds.height - 150, mouseYInCanvas - dragOffset.y));
        setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
      } else if (connecting.active) {
        setConnecting(prev => ({
          ...prev,
          x: mouseXInCanvas,
          y: mouseYInCanvas
        }));
      }
    };

    const handleGlobalMouseUp = () => {
      setDraggingNodeId(null);
      setConnecting({ active: false, startNodeId: null, startPlugType: null, x: 0, y: 0 });
    };

    if (draggingNodeId || connecting.active) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingNodeId, connecting.active, dragOffset]);

  // --- RIGHT CLICK MENU LOGIC ---
  const handleContextMenu = (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    setContextMenu({
      visible: true,
      x: e.clientX - canvasRect.left,
      y: e.clientY - canvasRect.top
    });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleSpawnNodeFromMenu = (type) => {
    const nextId = `node_${Date.now()}`;
    const spawnedNode = type === "condition" 
      ? { id: nextId, type: "condition", title: "New Condition Node", x: contextMenu.x, y: contextMenu.y, operator: "AND", rules: [{ field: "payload.city", operator: "equals", value: "" }] }
      : { id: nextId, type: "action", title: "New Action Step", x: contextMenu.x, y: contextMenu.y, actionType: "", targetKey: "", targetValue: "" };

    setNodes(prev => [...prev, spawnedNode]);
    closeContextMenu();
  };

  // --- PLUG CONNECTION LOGIC ---
  const handleNodeDragStart = (e, id) => {
    if (
      e.target.closest('.dropdownContainerParent') || 
      e.target.tagName.toLowerCase() === 'input' || 
      e.target.tagName.toLowerCase() === 'button' ||
      e.target.closest(`.${styles.socketAnchorPlugSource}`) ||
      e.target.closest(`.${styles.socketAnchorPlugTarget}`)
    ) return;
    
    closeContextMenu();
    setDraggingNodeId(id);
    const node = nodes.find(n => n.id === id);
    if (node && canvasRef.current) {
      const canvasBounds = canvasRef.current.getBoundingClientRect();
      const mouseXInCanvas = e.clientX - canvasBounds.left;
      const mouseYInCanvas = e.clientY - canvasBounds.top;
      setDragOffset({ x: mouseXInCanvas - node.x, y: mouseYInCanvas - node.y });
    }
  };

  const handlePlugMouseDown = (e, nodeId, plugType) => {
    e.stopPropagation();
    e.preventDefault();
    closeContextMenu();
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    setConnecting({
      active: true,
      startNodeId: nodeId,
      startPlugType: plugType,
      x: e.clientX - canvasBounds.left,
      y: e.clientY - canvasBounds.top
    });
  };

  const handlePlugMouseUp = (e, dropNodeId, dropPlugType) => {
    e.stopPropagation();
    if (connecting.active && connecting.startNodeId && connecting.startNodeId !== dropNodeId) {
      if (connecting.startPlugType !== dropPlugType) {
         const sourceId = connecting.startPlugType === 'source' ? connecting.startNodeId : dropNodeId;
         const targetId = connecting.startPlugType === 'target' ? connecting.startNodeId : dropNodeId;

         const exists = edges.find(edge => edge.from === sourceId && edge.to === targetId);
         if (!exists) {
           setEdges(prev => [...prev, { 
             id: `edge_${Date.now()}`, 
             from: sourceId, 
             to: targetId, 
             label: "Linked Path" 
           }]);
         }
      }
    }
    setConnecting({ active: false, startNodeId: null, startPlugType: null, x: 0, y: 0 });
  };

  const handleDeleteNode = (id) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.from !== id && e.to !== id));
  };

  const handleManualSave = () => {
    setSaveStatus("Saving workflow...");
    setTimeout(() => {
      setSaveStatus("Workflow successfully saved");
      alert("Workflow configuration has been fully saved and published.");
    }, 800);
  };

  // --- SVG PATH CALCULATION ---
  const calculateBezierPath = (startX, startY, endX, endY) => {
    const controlPointOffset = Math.max(Math.abs(endX - startX) * 0.5, 60); 
    return `M ${startX} ${startY} C ${startX + controlPointOffset} ${startY}, ${endX - controlPointOffset} ${endY}, ${endX} ${endY}`;
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    }) + " (" + new Date(isoString).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + ")";
  };

  const sidebarMenuItems = [
    { id: "canvas", label: "Overview Canvas", icon: FiLayout, onClick: () => router.push('/dashboard') },
    { id: "workflows", label: "Workflows Builder", icon: FiGitBranch, onClick: () => router.push('/workflows') },
    { id: "invoices", label: "Invoices & ERP", icon: FiCreditCard, onClick: () => router.push('/dashboard') },
    { id: "settings", label: "Settings", icon: FiSettings, disabled: true }
  ];

  return (
    <div className={styles.adminLayout} onClick={closeContextMenu}>
      <Sidebar items={sidebarMenuItems} activeId="workflows" />

      <main className={styles.mainCanvas}>
        <div className={styles.pageMaxWidth}>
          
          <header className={styles.pageHeader}>
            <div className={styles.headerLeftBlock}>
              <button className={styles.backButton} onClick={() => router.push('/workflows')} title="Return to Workflows List">
                <FiArrowLeft />
              </button>
              <div className={styles.headerTitle}>
                <div className={styles.titleRow}>
                  <h1>Kylas Free-Form Workflow</h1>
                  <span className={styles.statusBadge}>Draft</span>
                </div>
                <span className={styles.autoSaveLabel}>{saveStatus}</span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <AdminButton variant="secondary" icon={FiFileText} onClick={() => setSaveStatus("Manual draft saved")}>
                Save Draft
              </AdminButton>
              <AdminButton variant="primary" icon={FiSave} onClick={handleManualSave}>
                Save Workflow
              </AdminButton>
            </div>
          </header>

          <div className={styles.tabBar}>
            <button className={`${styles.tabBtn} ${activeTab === "builder" ? styles.tabActive : ""}`} onClick={() => setActiveTab("builder")}>
              <FiGrid /> Workflow
            </button>
            <button className={`${styles.tabBtn} ${activeTab === "history" ? styles.tabActive : ""}`} onClick={() => setActiveTab("history")}>
              <FiClock /> Version history
            </button>
            <button className={`${styles.tabBtn} ${activeTab === "logs" ? styles.tabActive : ""}`} onClick={() => setActiveTab("logs")}>
              <FiList /> Logs
            </button>
          </div>

          <div className={styles.tabContentFrame}>
            {activeTab === "builder" && (
              <div 
                ref={canvasRef}
                className={styles.graphWorkspaceFrame}
                onContextMenu={handleContextMenu}
              >
                {/* DYNAMIC SVG CONNECTOR LINES */}
                <svg className={styles.svgOverlayLayer}>
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#27347B" />
                    </marker>
                    <marker id="arrow-temp" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#8c9196" />
                    </marker>
                  </defs>

                  {/* Render Fixed Graph Edges */}
                  {edges.map((edge) => {
                    const sourceNode = nodes.find(n => n.id === edge.from);
                    const targetNode = nodes.find(n => n.id === edge.to);
                    if (!sourceNode || !targetNode) return null;
                    
                    const startX = sourceNode.x + 300;
                    const startY = sourceNode.y + 52;
                    const endX = targetNode.x;
                    const endY = targetNode.y + 52;

                    return (
                      <g key={edge.id} onDoubleClick={() => setEdges(prev => prev.filter(e => e.id !== edge.id))}>
                        <path 
                          d={calculateBezierPath(startX, startY, endX, endY)} 
                          className={styles.connectorVectorLine}
                          markerEnd="url(#arrow)"
                        />
                        <foreignObject x={(startX + endX) / 2 - 60} y={(startY + endY) / 2 - 12} width="120" height="24">
                          <div className={styles.edgeOverlayLabel} title="Double-click to delete path">{edge.label}</div>
                        </foreignObject>
                      </g>
                    );
                  })}

                  {/* Render Live Tracking Temp Line */}
                  {connecting.active && connecting.startNodeId && (() => {
                    const startNode = nodes.find(n => n.id === connecting.startNodeId);
                    if (!startNode) return null;
                    
                    const sX = connecting.startPlugType === 'source' ? startNode.x + 300 : connecting.x;
                    const sY = connecting.startPlugType === 'source' ? startNode.y + 52 : connecting.y;
                    const eX = connecting.startPlugType === 'target' ? startNode.x : connecting.x;
                    const eY = connecting.startPlugType === 'target' ? startNode.y + 52 : connecting.y;

                    return (
                      <path 
                        d={calculateBezierPath(sX, sY, eX, eY)} 
                        className={styles.tempConnectorLine}
                        markerEnd="url(#arrow-temp)"
                      />
                    );
                  })()}
                </svg>

                {/* DRAGGABLE NODE BLOCKS */}
                {nodes.map((node) => (
                  <div 
                    key={node.id}
                    className={`${styles.canvasNodeBlockCard} ${styles[`node_${node.type}`]} ${draggingNodeId === node.id ? styles.nodeActiveDraggingState : ""}`}
                    style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
                    onMouseDown={(e) => handleNodeDragStart(e, node.id)}
                  >
                    <div className={styles.nodeCardDragHeader}>
                      <div className={styles.nodeCardHeaderLeftTitle}>
                        <FiMove className={styles.dragHandleIconVector} />
                        <h4>{node.title}</h4>
                      </div>
                      {node.type !== "trigger" && (
                        <button className={styles.deleteNodeBtn} onClick={() => handleDeleteNode(node.id)}>&times;</button>
                      )}
                    </div>

                    <div className={styles.nodeCardInteriorWorkspace}>
                      {node.type === "trigger" && (
                        <div className={styles.blockFieldRowContent}>
                          <label>Incoming Event Channel</label>
                          <div className={styles.triggerEventBadgeDisplay}><FiZap /> Lead Created Event Stream</div>
                          <p className={styles.nodeHelpText}>Drag from the right socket to connect downstream logic.</p>
                        </div>
                      )}

                      {node.type === "condition" && (
                        <div className={styles.blockFieldRowContent}>
                          <div className={styles.conditionBlockSubHeadingRow}>
                            <label>Evaluation Operator</label>
                            <span className={styles.hybridOperatorBadge}>{node.operator}</span>
                          </div>
                          
                          {node.rules.map((rule, idx) => (
                            <div key={idx} className={styles.canvasInlineExpressionLine}>
                              <div className="dropdownContainerParent">
                                <Dropdown 
                                  options={TRIGGER_FIELDS} 
                                  selectedValue={rule.field}
                                  onSelect={(val) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, rules: n.rules.map((r, rIdx) => rIdx === idx ? { ...r, field: val } : r) }: n))}
                                />
                              </div>
                              <div className="dropdownContainerParent" style={{ margin: "6px 0" }}>
                                <Dropdown 
                                  options={OPERATOR_OPTIONS} 
                                  selectedValue={rule.operator}
                                  onSelect={(val) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, rules: n.rules.map((r, rIdx) => rIdx === idx ? { ...r, operator: val } : r) }: n))}
                                />
                              </div>
                              <input 
                                type="text" 
                                className={styles.canvasBlockTextInput}
                                placeholder="Value mapping..."
                                value={rule.value}
                                onChange={(e) => {
                                  const targetVal = e.target.value;
                                  setNodes(prev => prev.map(n => n.id === node.id ? { ...n, rules: n.rules.map((r, rIdx) => rIdx === idx ? { ...r, value: targetVal } : r) }: n));
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {node.type === "action" && (
                        <div className={styles.blockFieldRowContent}>
                          <label>Target Handler Action</label>
                          <div className="dropdownContainerParent">
                            <Dropdown 
                              options={ACTION_OPTIONS}
                              selectedValue={node.actionType}
                              onSelect={(val) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, actionType: val } : n))}
                            />
                          </div>
                          
                          <div className={styles.canvasBlockMiniFormStack}>
                            <input 
                              type="text" 
                              placeholder="Context Map Key (e.g. ownerId)" 
                              value={node.targetKey}
                              onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, targetKey: e.target.value } : n))}
                            />
                            <input 
                              type="text" 
                              placeholder="Inject Value Formula" 
                              value={node.targetValue}
                              onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, targetValue: e.target.value } : n))}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SOURCE OUTBOUND PLUG */}
                    <div 
                      className={styles.socketAnchorPlugSource} 
                      title="Drag to connect to another node"
                      onMouseDown={(e) => handlePlugMouseDown(e, node.id, 'source')}
                      onMouseUp={(e) => handlePlugMouseUp(e, node.id, 'source')}
                    />

                    {/* TARGET INBOUND PLUG */}
                    {node.type !== "trigger" && (
                      <div 
                        className={styles.socketAnchorPlugTarget} 
                        title="Drag backwards or drop connection here"
                        onMouseDown={(e) => handlePlugMouseDown(e, node.id, 'target')}
                        onMouseUp={(e) => handlePlugMouseUp(e, node.id, 'target')}
                      />
                    )}
                  </div>
                ))}

                {/* RIGHT CLICK CONTEXT MENU PORTAL */}
                {contextMenu.visible && (
                  <ul 
                    className={styles.contextMenuContainer}
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                  >
                    <li className={styles.contextMenuLabel}>Add Graph Element</li>
                    <li onClick={(e) => { e.stopPropagation(); handleSpawnNodeFromMenu("condition"); }}>
                      <FiGitBranch /> Conditional / If-Else Block
                    </li>
                    <li onClick={(e) => { e.stopPropagation(); handleSpawnNodeFromMenu("action"); }}>
                      <FiPlayCircle /> Execution Action Step
                    </li>
                  </ul>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className={styles.historyListFrame}>
                <div className={styles.infoAlertBanner}>
                  <FiClock /> <span>Graph compilation engine automatically tracks visual coordinate offsets and node expression logic maps.</span>
                </div>
                <div className={styles.timelineContainer}>
                  {MOCK_VERSIONS.map((ver) => (
                    <div key={ver.versionId} className={styles.timelineItem}>
                      <div className={styles.timelineMarker}>
                        <div className={styles.markerCircle} />
                        <div className={styles.markerLine} />
                      </div>
                      <div className={styles.versionCard}>
                        <div className={styles.versionMetaRow}>
                          <span className={styles.versionBadgeName}>{ver.versionId.toUpperCase()}</span>
                          <span className={styles.versionTimestampStamp}>{new Date(ver.timestamp).toLocaleString()}</span>
                        </div>
                        <p className={styles.versionDescText}>{ver.description}</p>
                        <span className={styles.versionAuthorTag}>Modified by: <strong>{ver.Author}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LOGS TAB RENDERING */}
            {activeTab === "logs" && (
              <div className={styles.logsDashboardSplitView}>
                <div className={styles.logsListBlockColumn}>
                  <h3>Recent Trigger Events</h3>
                  <div className={styles.logsListStack}>
                    {logs.map((log) => (
                      <div 
                        key={log.logId} 
                        className={`${styles.logRowItemSummary} ${selectedLog?.logId === log.logId ? styles.logRowActiveSelected : ""}`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className={styles.logLeftIndicatorMeta}>
                          {log.status === "success" ? (
                            <FiCheckCircle className={styles.logSuccessStatusIcon} />
                          ) : (
                            <FiAlertCircle className={styles.logFailStatusIcon} />
                          )}
                          <div className={styles.logTextLabelStack}>
                            <span className={styles.logEventTitle}>{log.event}</span>
                            <span className={styles.logIdHashSub}>{log.logId}</span>
                          </div>
                        </div>
                        <span className={styles.logTimeBadgeStamp}>{formatDate(log.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.logPayloadInspectorColumn}>
                  {selectedLog ? (
                    <div className={styles.inspectorCanvasCard}>
                      <div className={styles.inspectorHeaderTitleRow}>
                        <h4>Payload Data Inspector</h4>
                        <span className={`${styles.statusPillLabel} ${selectedLog.status === "success" ? styles.pillSuccessColor : styles.pillFailColor}`}>
                          {selectedLog.status.toUpperCase()}
                        </span>
                      </div>
                      <p className={styles.inspectorHelpGuideText}>Review the incoming parameter block received from Kylas and the resulting data passed downstream.</p>
                      
                      <div className={styles.jsonBlockWrapperContainer}>
                        <div className={styles.jsonBlockTitleLabel}><FiCode /> Incoming Data Payload (Trigger Entered)</div>
                        <pre className={styles.jsonPreformattingBlock}>
                          {JSON.stringify(selectedLog.incomingPayload, null, 2)}
                        </pre>
                      </div>

                      <div className={styles.jsonBlockWrapperContainer}>
                        <div className={styles.jsonBlockTitleLabel}><FiGrid /> Outgoing Target Actions Data (Passed)</div>
                        <pre className={styles.jsonPreformattingBlock}>
                          {JSON.stringify(selectedLog.passedData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.emptyInspectorPlaceholderBlock}>
                      <FiCode className={styles.emptyInspectorIconGraphic} />
                      <p>Select an execution log event from the left list block to inspect parameter routing structures.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}