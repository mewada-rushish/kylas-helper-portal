"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  FiZap, FiGitBranch, FiPlayCircle, FiSave, FiTrash2, 
  FiLayout, FiCreditCard, FiSettings, FiArrowLeft, FiClock, 
  FiMove, FiGrid, FiPlus, FiList, FiCheckCircle, FiAlertCircle,
  FiCode, FiFileText, FiMinus, FiX
} from "react-icons/fi";
import Sidebar from "@/components/layout/sidebar/sidebar";
import AdminButton from "@/components/ui/button/button";
import Dropdown from "@/components/ui/dropdown/dropdown";
import toast from "react-hot-toast";
import styles from "./workflows.module.css";

const TRIGGER_OPTIONS = [
  { label: "Lead is Created", value: "lead.created" },
  { label: "Lead is Updated", value: "lead.updated" },
  { label: "Deal is Won", value: "deal.won" },
  { label: "Contact is Updated", value: "contact.updated" }
];

const TRIGGER_FIELDS = [
  { value: "payload.stage", label: "Lead Pipeline Stage" },
  { value: "payload.leadTemperature", label: "Lead Temperature" },
  { value: "payload.interestedIn", label: "Interested In" },
  { value: "payload.city", label: "Lead City" }
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

const DEFAULT_ACTION_PAYLOADS = {
  update_owner: { ownerId: "usr_default_01", assignmentMode: "round_robin", backupOwnerId: "usr_backup_99", notifyTeam: true },
  create_task: { taskTitle: "Follow up with client", dueDateOffsetDays: 2, priority: "high", description: "Automated task setup rules." },
  send_whatsapp: { templateId: "default_welcome_alert", languageCode: "en_IN", fallbackChannel: "sms", retryCount: 3 }
};

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
    incomingPayload: { leadId: 54921, stage: "Qualified", leadTemperature: "Hot", interestedIn: "Gym", city: "Mumbai" },
    passedData: { action: "update_owner", assignedOwnerId: "usr_closers_99", apiResponseStatus: 200 }
  }
];

const calculateBezierPath = (startX, startY, endX, endY) => {
  const controlPointOffset = Math.max(Math.abs(endX - startX) * 0.5, 60); 
  return `M ${startX} ${startY} C ${startX + controlPointOffset} ${startY}, ${endX - controlPointOffset} ${endY}, ${endX} ${endY}`;
};

export default function WorkflowCanvasEngine() {
  const router = useRouter();
  const params = useParams();

  const [nodes, setNodes] = useState([
    { id: "node_1", type: "trigger", title: "Workflow Trigger", x: 40, y: 220, event: "lead.created" },
    { 
      id: "node_2", 
      type: "condition_router", 
      title: "Hybrid Evaluation Router", 
      x: 560, 
      y: 60, 
      branches: [
        { 
          branchId: "branch_hot_gym", 
          name: "Path 1: Hot Gym Prospects", 
          grouped: true,
          conditions: { 
            rules: [
              { field: "payload.stage", operator: "equals", value: "Qualified", joinOperator: "AND" },
              { field: "payload.leadTemperature", operator: "equals", value: "Hot", joinOperator: "AND" },
              { field: "payload.interestedIn", operator: "equals", value: "Gym", joinOperator: "AND" }
            ] 
          } 
        },
        { branchId: "branch_fallback", name: "Path 2: Else (Fallback)", isFallback: true, grouped: true }
      ] 
    },
    { id: "node_3", type: "action", title: "Assign Close Team", x: 1160, y: 60, actionType: "update_owner", payloadOverrides: [{ key: "ownerId", value: "usr_closers_99" }] },
    { id: "node_4", type: "action", title: "Send WhatsApp Alert", x: 1160, y: 420, actionType: "send_whatsapp", payloadOverrides: [{ key: "templateId", value: "unrouted_stage_notification" }] }
  ]);

  const [edges, setEdges] = useState([
    { id: "edge_1", fromPlug: "source-node_1-main", toPlug: "target-node_2", label: "Evaluate Data" },
    { id: "edge_2", fromPlug: "source-node_2-branch_hot_gym-grouped", toPlug: "target-node_3", label: "True Branch" },
    { id: "edge_3", fromPlug: "source-node_2-branch_fallback-grouped", toPlug: "target-node_4", label: "Fallback Path" }
  ]);

  const [activeTab, setActiveTab] = useState("builder");
  const [saveStatus, setSaveStatus] = useState("All changes saved");
  const canvasRef = useRef(null);

  const [logs] = useState(INITIAL_LOGS);
  const [selectedLog, setSelectedLog] = useState(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [plugPositions, setPlugPositions] = useState({});
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState({ active: false, startPlugId: null, startPlugType: null, x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState({ visible: false, menuX: 0, menuY: 0, spawnX: 0, spawnY: 0 });

  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    const updatePlugPositions = () => {
      if (!canvasRef.current) return;
      const wrapperElement = canvasRef.current.querySelector(`.${styles.canvasContentWrapper}`);
      if (!wrapperElement) return;
      
      const wrapperRect = wrapperElement.getBoundingClientRect();
      const newPositions = {};
      
      const plugs = wrapperElement.querySelectorAll('[data-plug-id]');
      plugs.forEach(plug => {
        const rect = plug.getBoundingClientRect();
        const localX = (rect.left + rect.width / 2 - wrapperRect.left) / zoom;
        const localY = (rect.top + rect.height / 2 - wrapperRect.top) / zoom;
        newPositions[plug.getAttribute('data-plug-id')] = { x: localX, y: localY };
      });
      
      setPlugPositions(newPositions);
    };

    updatePlugPositions();

    const wrapperElement = canvasRef.current?.querySelector(`.${styles.canvasContentWrapper}`);
    if (!wrapperElement) return;

    const resizeObserver = new ResizeObserver(() => {
      updatePlugPositions();
    });

    resizeObserver.observe(wrapperElement);
    const cards = wrapperElement.querySelectorAll(`.${styles.canvasNodeBlockCard}`);
    cards.forEach(c => resizeObserver.observe(c));

    return () => resizeObserver.disconnect();
  }, [nodes, zoom, pan]);

  useEffect(() => {
    if (nodes.length === 0) return;
    setSaveStatus("Compiling node modifications...");
    const debounceTimer = setTimeout(() => {
      setSaveStatus("Canvas modifications auto-saved to draft");
    }, 1500);
    return () => clearTimeout(debounceTimer);
  }, [nodes, edges]);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const handleWindowWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const zoomFactor = 0.05;
        if (e.deltaY < 0) {
          setZoom(z => Math.min(2, z + zoomFactor));
        } else {
          setZoom(z => Math.max(0.4, z - zoomFactor));
        }
      }
    };

    canvasElement.addEventListener("wheel", handleWindowWheel, { passive: false });
    return () => {
      canvasElement.removeEventListener("wheel", handleWindowWheel);
    };
  }, []);

  const transformClientToLocalCoords = (clientX, clientY) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom
    };
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!canvasRef.current) return;

      if (draggingNodeId) {
        const localMouse = transformClientToLocalCoords(e.clientX, e.clientY);
        setNodes(prev => prev.map(n => n.id === draggingNodeId ? { 
          ...n, 
          x: localMouse.x - dragOffset.x, 
          y: localMouse.y - dragOffset.y 
        } : n));
      } else if (connecting.active) {
        const localMouse = transformClientToLocalCoords(e.clientX, e.clientY);
        setConnecting(prev => ({ ...prev, x: localMouse.x, y: localMouse.y }));
      } else if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      }
    };

    const handleGlobalMouseUp = () => {
      setDraggingNodeId(null);
      setConnecting({ active: false, startPlugId: null, startPlugType: null, x: 0, y: 0 });
      setIsPanning(false);
    };

    if (draggingNodeId || connecting.active || isPanning) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingNodeId, connecting.active, isPanning, dragOffset, pan, zoom, panStart]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const localMouse = transformClientToLocalCoords(e.clientX, e.clientY);
    
    setContextMenu({
      visible: true,
      menuX: e.clientX - canvasRect.left,
      menuY: e.clientY - canvasRect.top,
      spawnX: localMouse.x,
      spawnY: localMouse.y
    });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleSpawnNodeFromMenu = (type) => {
    const nextId = `node_${Date.now()}`;
    const spawnedNode = type === "condition_router" 
      ? { id: nextId, type: "condition_router", title: "Condition Router", x: contextMenu.spawnX, y: contextMenu.spawnY, branches: [{ branchId: `b_${Date.now()}`, name: "Path 1", grouped: true, conditions: { rules: [{ field: "payload.stage", operator: "equals", value: "", joinOperator: "AND" }] } }, { branchId: `bf_${Date.now()}`, name: "Else", isFallback: true, grouped: true }] }
      : { id: nextId, type: "action", title: "New Action Step", x: contextMenu.spawnX, y: contextMenu.spawnY, actionType: "update_owner", payloadOverrides: [] };

    setNodes(prev => [...prev, spawnedNode]);
    closeContextMenu();
  };

  const handleCanvasMouseDown = (e) => {
    if (e.button !== 0) return;
    if (
      e.target.closest(`.${styles.canvasNodeBlockCard}`) || 
      e.target.closest(`.${styles.contextMenuContainer}`) ||
      e.target.closest(`.${styles.zoomControlsPanel}`)
    ) return;

    closeContextMenu();
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleNodeDragStart = (e, id) => {
    if (
      e.target.closest('.dropdownContainerParent') || 
      e.target.tagName.toLowerCase() === 'input' || 
      e.target.tagName.toLowerCase() === 'button' ||
      e.target.hasAttribute('data-plug-id') ||
      e.target.closest(`.${styles.toggleSwitch}`)
    ) return;
    
    closeContextMenu();
    setDraggingNodeId(id);
    const node = nodes.find(n => n.id === id);
    if (node) {
      const localMouse = transformClientToLocalCoords(e.clientX, e.clientY);
      setDragOffset({ x: localMouse.x - node.x, y: localMouse.y - node.y });
    }
  };

  const handlePlugMouseDown = (e, plugId, plugType) => {
    closeContextMenu();
    e.stopPropagation();
    e.preventDefault();
    const pos = plugPositions[plugId];
    if (pos) {
      setConnecting({ active: true, startPlugId: plugId, startPlugType: plugType, x: pos.x, y: pos.y });
    }
  };

  const handlePlugMouseUp = (e, dropPlugId, dropPlugType) => {
    e.stopPropagation();
    if (connecting.active && connecting.startPlugId && connecting.startPlugId !== dropPlugId) {
      if (connecting.startPlugType !== dropPlugType) {
        const sourcePlugId = connecting.startPlugType === 'source' ? connecting.startPlugId : dropPlugId;
        const targetPlugId = connecting.startPlugType === 'target' ? connecting.startPlugId : dropPlugId;

        const exists = edges.find(edge => edge.fromPlug === sourcePlugId && edge.toPlug === targetPlugId);
        if (!exists) {
          setEdges(prev => [...prev, { 
            id: `edge_${Date.now()}`, 
            fromPlug: sourcePlugId,
            toPlug: targetPlugId, 
            label: "Linked Data" 
          }]);
        }
      }
    }
    setConnecting({ active: false, startPlugId: null, startPlugType: null, x: 0, y: 0 });
  };

  const handleToggleGrouped = (nodeId, branchId) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? {
      ...n,
      branches: n.branches.map(b => b.branchId === branchId ? { ...b, grouped: !b.grouped } : b)
    } : n));
    setEdges(prev => prev.filter(e => !e.fromPlug.includes(branchId)));
  };

  const handleAddRuleClause = (nodeId, branchId) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? {
      ...n,
      branches: n.branches.map(b => b.branchId === branchId ? {
        ...b,
        conditions: { ...b.conditions, rules: [...b.conditions.rules, { field: "payload.stage", operator: "equals", value: "", joinOperator: "AND" }] }
      } : b)
    } : n));
  };

  const handleDeleteRuleClause = (nodeId, branchId, ruleIdx) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? {
      ...n,
      branches: n.branches.map(b => b.branchId === branchId ? {
        ...b,
        conditions: { ...b.conditions, rules: b.conditions.rules.filter((_, idx) => idx !== ruleIdx) }
      } : b)
    } : n));
    setEdges(prev => prev.filter(e => !e.fromPlug.includes(`${branchId}-rule-${ruleIdx}`)));
  };

  const handleUpdateRuleJoinOperator = (nodeId, branchId, ruleIdx, op) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? {
      ...n,
      branches: n.branches.map(b => b.branchId === branchId ? {
        ...b,
        conditions: {
          ...b.conditions,
          rules: b.conditions.rules.map((r, idx) => idx === ruleIdx ? { ...r, joinOperator: op } : r)
        }
      } : b)
    } : n));
  };

  const handleAddCustomPath = (nodeId) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? {
      ...n,
      branches: [
        ...n.branches.filter(b => !b.isFallback),
        { branchId: `branch_${Date.now()}`, name: `Path ${n.branches.length}: Rules Match`, grouped: true, conditions: { rules: [{ field: "payload.stage", operator: "equals", value: "", joinOperator: "AND" }] } },
        ...n.branches.filter(b => b.isFallback)
      ]
    } : n));
  };

  const handleDeleteCustomPath = (nodeId, branchId) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? {
      ...n,
      branches: n.branches.filter(b => b.branchId !== branchId)
    } : n));
    setEdges(prev => prev.filter(e => !e.fromPlug.includes(branchId)));
  };

  const handleAddActionOverride = (nodeId) => {
    setNodes(prev => prev.map(n => {
      if (n.id !== nodeId) return n;
      const defaultPayload = DEFAULT_ACTION_PAYLOADS[n.actionType] || {};
      const remainingKeys = Object.keys(defaultPayload).filter(k => !n.payloadOverrides.some(o => o.key === k));
      if (remainingKeys.length === 0) return n;
      return { ...n, payloadOverrides: [...n.payloadOverrides, { key: remainingKeys[0], value: "" }] };
    }));
  };

  const handleUpdateActionOverride = (nodeId, index, key, value) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? {
      ...n,
      payloadOverrides: n.payloadOverrides.map((o, idx) => idx === index ? { ...o, [key]: value } : o)
    } : n));
  };

  const handleDeleteActionOverride = (nodeId, index) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? {
      ...n,
      payloadOverrides: n.payloadOverrides.filter((_, idx) => idx !== index)
    } : n));
  };

  const handleActionTypeChange = (nodeId, type) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, actionType: type, payloadOverrides: [] } : n));
  };

  const handleDeleteNode = (id) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => !e.fromPlug.includes(id) && !e.toPlug.includes(id)));
  };

  const handleManualSave = () => {
    setSaveStatus("Saving workflow...");
    setTimeout(() => {
      setSaveStatus("Workflow successfully saved");
      toast.success("Workflow configuration has been fully saved and published.");
    }, 800);
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
                className={`${styles.graphWorkspaceFrame} ${isPanning ? styles.panningWorkspaceState : ""}`}
                onContextMenu={handleContextMenu}
                onMouseDown={handleCanvasMouseDown}
              >
                <div 
                  className={styles.canvasContentWrapper}
                  style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                >
                  <svg className={styles.svgOverlayLayer}>
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#27347B" />
                      </marker>
                      <marker id="arrow-temp" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#8c9196" />
                      </marker>
                    </defs>

                    {edges.map((edge) => {
                      const startPos = plugPositions[edge.fromPlug];
                      const endPos = plugPositions[edge.toPlug];

                      if (!startPos || !endPos) return null;
                      
                      return (
                        <g key={edge.id} onDoubleClick={() => setEdges(prev => prev.filter(e => e.id !== edge.id))}>
                          <path 
                            d={calculateBezierPath(startPos.x, startPos.y, endPos.x, endPos.y)} 
                            className={styles.connectorVectorLine}
                            markerEnd="url(#arrow)"
                          />
                          <foreignObject 
                            x={(startPos.x + endPos.x) / 2 - 60} 
                            y={(startPos.y + endPos.y) / 2 - 16} 
                            width="120" 
                            height="32"
                            style={{ overflow: 'visible' }}
                          >
                            <div className={styles.edgeOverlayLabel} title="Double-click to drop line">{edge.label}</div>
                          </foreignObject>
                        </g>
                      );
                    })}

                    {connecting.active && connecting.startPlugId && (() => {
                      const startPos = plugPositions[connecting.startPlugId];
                      if (!startPos) return null;
                      
                      const sX = connecting.startPlugType === 'source' ? startPos.x : connecting.x;
                      const sY = connecting.startPlugType === 'source' ? startPos.y : connecting.y;
                      const eX = connecting.startPlugType === 'target' ? startPos.x : connecting.x;
                      const eY = connecting.startPlugType === 'target' ? startPos.y : connecting.y;

                      return (
                        <path d={calculateBezierPath(sX, sY, eX, eY)} className={styles.tempConnectorLine} markerEnd="url(#arrow-temp)" />
                      );
                    })()}
                  </svg>

                  {nodes.map((node) => (
                    <div 
                      key={node.id}
                      className={`${styles.canvasNodeBlockCard} ${styles[`node_${node.type}`]} ${draggingNodeId === node.id ? styles.nodeActiveDraggingState : ""}`}
                      style={{ left: `${node.x}px`, top: `${node.y}px` }}
                      onMouseDown={(e) => handleNodeDragStart(e, node.id)}
                    >
                      <div className={styles.nodeCardDragHeader}>
                        <div className={styles.nodeCardHeaderLeftTitle}>
                          <FiMove className={styles.dragHandleIconVector} />
                          <h4>{node.title}</h4>
                        </div>
                        {node.type !== "trigger" && (
                          <button className={styles.deleteNodeBtn} onClick={() => handleDeleteNode(node.id)}><FiX /></button>
                        )}
                      </div>

                      <div className={styles.nodeCardInteriorWorkspace}>
                        {node.type === "trigger" && (
                          <div className={styles.blockFieldRowContent}>
                            <label>Incoming Event Channel</label>
                            <div className="dropdownContainerParent">
                              <Dropdown 
                                options={TRIGGER_OPTIONS}
                                selectedValue={node.event}
                                onSelect={(val) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, event: val } : n))}
                              />
                            </div>
                            <div 
                              className={styles.socketAnchorPlugSource} 
                              data-plug-id={`source-${node.id}-main`}
                              onMouseDown={(e) => handlePlugMouseDown(e, `source-${node.id}-main`, 'source')}
                              onMouseUp={(e) => handlePlugMouseUp(e, `source-${node.id}-main`, 'source')}
                            />
                          </div>
                        )}

                        {node.type === "condition_router" && (
                          <div className={styles.blockFieldRowContent}>
                            {node.branches.map((branch) => (
                              <div key={branch.branchId} className={`${styles.branchConfigBox} ${branch.isFallback ? styles.fallbackBoxColor : ""}`}>
                                <div className={styles.branchConfigBoxHeader}>
                                  <span>{branch.name}</span>
                                  {!branch.isFallback && (
                                    <div className={styles.branchHeaderControls}>
                                      <button 
                                        className={styles.deletePathBtn} 
                                        onClick={() => handleDeleteCustomPath(node.id, branch.branchId)}
                                        title="Remove Path"
                                      >
                                        <FiTrash2 />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {!branch.isFallback && (
                                  <div className={styles.groupedToggleWrapper}>
                                    <span className={styles.groupedToggleLabel}>All checks passed</span>
                                    <button 
                                      className={`${styles.toggleSwitch} ${branch.grouped ? styles.toggleOn : ""}`}
                                      onClick={() => handleToggleGrouped(node.id, branch.branchId)}
                                    >
                                      <div className={styles.toggleKnob} />
                                    </button>
                                  </div>
                                )}

                                {!branch.isFallback && (
                                  <div className={styles.nestedRulesStack}>
                                    {branch.conditions?.rules.map((rule, rIdx) => (
                                      <div key={rIdx} className={styles.nestedRuleRowWrapper}>
                                        {rIdx > 0 && (
                                          <div className={styles.interConditionJoinRow}>
                                            <button 
                                              className={`${styles.joinOpToggleBtn} ${rule.joinOperator === "AND" ? styles.joinOpActive : ""}`}
                                              onClick={() => handleUpdateRuleJoinOperator(node.id, branch.branchId, rIdx, "AND")}
                                            >
                                              AND
                                            </button>
                                            <button 
                                              className={`${styles.joinOpToggleBtn} ${rule.joinOperator === "OR" ? styles.joinOpActive : ""}`}
                                              onClick={() => handleUpdateRuleJoinOperator(node.id, branch.branchId, rIdx, "OR")}
                                            >
                                              OR
                                            </button>
                                          </div>
                                        )}
                                        
                                        <div className={styles.nestedRuleRow}>
                                          <div className={styles.ruleRowHeader}>
                                            <span className={styles.ruleLabel}>Condition {rIdx + 1}</span>
                                            {branch.conditions.rules.length > 1 && (
                                              <button 
                                                className={styles.deleteClauseRuleMiniBtn} 
                                                onClick={() => handleDeleteRuleClause(node.id, branch.branchId, rIdx)}
                                                title="Remove condition"
                                              >
                                                <FiX />
                                              </button>
                                            )}
                                          </div>
                                          <div className="dropdownContainerParent" style={{ marginBottom: '10px' }}>
                                            <Dropdown 
                                              options={TRIGGER_FIELDS} selectedValue={rule.field}
                                              onSelect={(val) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, branches: n.branches.map(b => b.branchId === branch.branchId ? { ...b, conditions: { ...b.conditions, rules: b.conditions.rules.map((r, ri) => ri === rIdx ? { ...r, field: val } : r) } } : b) } : n))}
                                            />
                                          </div>
                                          <div className={styles.flexInputsRowCond}>
                                            <div className="dropdownContainerParent">
                                              <Dropdown 
                                                options={OPERATOR_OPTIONS} selectedValue={rule.operator}
                                                onSelect={(val) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, branches: n.branches.map(b => b.branchId === branch.branchId ? { ...b, conditions: { ...b.conditions, rules: b.conditions.rules.map((r, ri) => ri === rIdx ? { ...r, operator: val } : r) } } : b) } : n))}
                                              />
                                            </div>
                                            <input 
                                              type="text" className={styles.canvasBlockTextInputCond} placeholder="Value..." value={rule.value}
                                              onChange={(e) => {
                                                const v = e.target.value;
                                                setNodes(prev => prev.map(n => n.id === node.id ? { ...n, branches: n.branches.map(b => b.branchId === branch.branchId ? { ...b, conditions: { ...b.conditions, rules: b.conditions.rules.map((r, ri) => ri === rIdx ? { ...r, value: v } : r) } } : b) } : n));
                                              }}
                                            />
                                          </div>
                                          
                                          {!branch.grouped && (
                                            <div 
                                              className={styles.ruleSocketPlug} 
                                              data-plug-id={`source-${node.id}-${branch.branchId}-rule-${rIdx}`}
                                              onMouseDown={(e) => handlePlugMouseDown(e, `source-${node.id}-${branch.branchId}-rule-${rIdx}`, 'source')}
                                              onMouseUp={(e) => handlePlugMouseUp(e, `source-${node.id}-${branch.branchId}-rule-${rIdx}`, 'source')}
                                            />
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    <button className={styles.addClauseRuleTextLink} onClick={() => handleAddRuleClause(node.id, branch.branchId)}>
                                      <FiPlus /> Add rule to this path
                                    </button>
                                  </div>
                                )}

                                {branch.isFallback && <p className={styles.fallbackHelpText}>Runs automatically if condition sets above return false.</p>}

                                {(branch.grouped || branch.isFallback) && (
                                  <div 
                                    className={styles.branchSocketPlug} 
                                    data-plug-id={`source-${node.id}-${branch.branchId}-grouped`}
                                    onMouseDown={(e) => handlePlugMouseDown(e, `source-${node.id}-${branch.branchId}-grouped`, 'source')}
                                    onMouseUp={(e) => handlePlugMouseUp(e, `source-${node.id}-${branch.branchId}-grouped`, 'source')}
                                  />
                                )}
                              </div>
                            ))}
                            
                            <button className={styles.addCustomPathOuterBtn} onClick={() => handleAddCustomPath(node.id)}>
                              <FiPlus /> Add Path Branch
                            </button>
                          </div>
                        )}

                        {node.type === "action" && (
                          <div className={styles.blockFieldRowContent}>
                            <label>Target Handler Action</label>
                            <div className="dropdownContainerParent">
                              <Dropdown 
                                options={ACTION_OPTIONS} 
                                selectedValue={node.actionType}
                                onSelect={(val) => handleActionTypeChange(node.id, val)}
                              />
                            </div>

                            <div className={styles.actionPayloadBox}>
                              <div className={styles.actionPayloadHeader}>
                                <span>JSON Blueprint Mapping Layer</span>
                              </div>
                              
                              <div className={styles.nestedRulesStack}>
                                {node.payloadOverrides?.map((override, oIdx) => {
                                  const blueprintKeys = Object.keys(DEFAULT_ACTION_PAYLOADS[node.actionType] || {}).map(k => ({
                                    label: `${k}`,
                                    value: k
                                  }));
                                  
                                  return (
                                    <div key={oIdx} className={styles.nestedRuleRow}>
                                      <div className={styles.ruleRowHeader}>
                                        <span className={styles.ruleLabel}>Override Parameter {oIdx + 1}</span>
                                        <button 
                                          className={styles.deleteClauseRuleMiniBtn} 
                                          onClick={() => handleDeleteActionOverride(node.id, oIdx)}
                                        >
                                          <FiX />
                                        </button>
                                      </div>
                                      <div className={styles.flexInputsRowAction}>
                                        <div className="dropdownContainerParent">
                                          <Dropdown 
                                            options={blueprintKeys}
                                            selectedValue={override.key}
                                            onSelect={(val) => handleUpdateActionOverride(node.id, oIdx, "key", val)}
                                          />
                                        </div>
                                        <input 
                                          type="text"
                                          className={styles.canvasBlockTextInputAction}
                                          placeholder="Value..."
                                          value={override.value}
                                          onChange={(e) => handleUpdateActionOverride(node.id, oIdx, "value", e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}

                                {Object.keys(DEFAULT_ACTION_PAYLOADS[node.actionType] || {}).length > (node.payloadOverrides?.length || 0) && (
                                  <button 
                                    className={styles.addClauseRuleTextLink} 
                                    onClick={() => handleAddActionOverride(node.id)}
                                  >
                                    <FiPlus /> Add mapping parameter
                                  </button>
                                )}
                              </div>
                            </div>

                            <div 
                              className={styles.socketAnchorPlugSource}
                              data-plug-id={`source-${node.id}-main`}
                              onMouseDown={(e) => handlePlugMouseDown(e, `source-${node.id}-main`, 'source')}
                              onMouseUp={(e) => handlePlugMouseUp(e, `source-${node.id}-main`, 'source')}
                            />
                          </div>
                        )}
                      </div>

                      {node.type !== "trigger" && (
                        <div 
                          className={styles.socketAnchorPlugTarget} 
                          data-plug-id={`target-${node.id}`}
                          onMouseDown={(e) => handlePlugMouseDown(e, `target-${node.id}`, 'target')}
                          onMouseUp={(e) => handlePlugMouseUp(e, `target-${node.id}`, 'target')}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.zoomControlsPanel}>
                  <span className={styles.zoomPercentage}>{Math.round(zoom * 100)}%</span>
                  <button className={styles.zoomBtn} onClick={() => setZoom(z => Math.min(2, z + 0.1))}><FiPlus /></button>
                  <button className={styles.zoomBtn} onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}><FiMinus /></button>
                  <button className={`${styles.zoomBtn} ${styles.zoomResetBtn}`} onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset</button>
                </div>

                {contextMenu.visible && (
                  <ul className={styles.contextMenuContainer} style={{ left: contextMenu.menuX, top: contextMenu.menuY }}>
                    <li className={styles.contextMenuLabel}>Create Element</li>
                    <li onClick={() => handleSpawnNodeFromMenu("condition_router")}><FiGitBranch /> Hybrid Condition Router</li>
                    <li onClick={() => handleSpawnNodeFromMenu("action")}><FiPlayCircle /> Execution Action Block</li>
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
                      <div className={styles.timelineMarker}><div className={styles.markerCircle} /><div className={styles.markerLine} /></div>
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
                          {log.status === "success" ? <FiCheckCircle className={styles.logSuccessStatusIcon} /> : <FiAlertCircle className={styles.logFailStatusIcon} />}
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