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

// Dynamic trigger options will be loaded from Incoming Webhooks
const DEFAULT_TRIGGER_OPTIONS = [
  { label: "Lead is Created", value: "lead.created" },
  { label: "Lead is Updated", value: "lead.updated" }
];

const DEFAULT_TRIGGER_FIELDS = [
  { value: "payload.id", label: "ID" }
];

const OPERATOR_OPTIONS = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
  { value: "greater_than", label: "Greater Than (>)" }
];

const ACTION_OPTIONS = [
  { value: "api_call", label: "External: HTTP API Call" },
  { value: "transform_concat", label: "Data: Concat Variables" },
  { value: "transform_trim", label: "Data: Trim Whitespace" },
  { value: "transform_filter", label: "Data: Filter Array" },
  { value: "update_owner", label: "Kylas: Assign Owner" },
  { value: "create_task", label: "Kylas: Create Task" },
  { value: "send_whatsapp", label: "WhatsApp: Broadcast Alert" }
];

const DEFAULT_ACTION_PAYLOADS = {
  api_call: { url: "https://api.example.com", method: "GET", headers: "{\n  \"Authorization\": \"Bearer TOKEN\"\n}", body: "" },
  transform_concat: { varA: "{{trigger.payload.firstName}}", varB: "{{trigger.payload.lastName}}", separator: " " },
  transform_trim: { input: "{{trigger.payload.name}}" },
  transform_filter: { inputArray: "{{trigger.payload.products}}", filterKey: "type", filterValue: "subscription" },
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

const getAncestors = (nodeId, allNodes, allEdges, visited = new Set()) => {
  if (visited.has(nodeId)) return [];
  visited.add(nodeId);
  
  const parentEdges = allEdges.filter(e => e.target.startsWith(`target-${nodeId}`));
  let ancestors = [];
  
  for (const edge of parentEdges) {
    const parentIdMatch = edge.source.match(/source-(node_\w+)/);
    if (parentIdMatch) {
      const parentId = parentIdMatch[1];
      ancestors.push(parentId);
      ancestors = ancestors.concat(getAncestors(parentId, allNodes, allEdges, visited));
    }
  }
  return [...new Set(ancestors)];
};

const getAvailableFieldsForNode = (nodeId, allNodes, allEdges, webhooks) => {
  const ancestors = getAncestors(nodeId, allNodes, allEdges);
  const ancestorNodes = allNodes.filter(n => ancestors.includes(n.id) || n.type === 'trigger');
  
  let allFields = [];
  const activeTriggerEvents = ancestorNodes.filter(n => n.type === 'trigger').map(n => n.event);
  
  activeTriggerEvents.forEach(evt => {
    const hook = webhooks.find(h => h.endpointPath === evt);
    if (hook && hook.selectedVariables) {
      try {
        const vars = JSON.parse(hook.selectedVariables);
        if (Array.isArray(vars)) {
          vars.forEach(v => {
            if (v && v.path) {
              if (!allFields.some(f => f.value === `payload.${v.path}`)) {
                allFields.push({ value: `payload.${v.path}`, label: `${hook.name}: ${v.customName || v.path}` });
              }
            }
          });
        }
      } catch(e) {}
    }
  });

  ancestorNodes.filter(n => n.type === 'action' && n.outputVariableName).forEach(n => {
    allFields.push({ 
      value: `step_${n.id}.${n.outputVariableName}`, 
      label: `${n.title || 'Action'}: ${n.outputVariableName}` 
    });
  });

  return allFields.length > 0 ? allFields : DEFAULT_TRIGGER_FIELDS;
};

export default function WorkflowCanvasEngine() {
  const router = useRouter();
  const params = useParams();

  // Workflow Core Database States
  const [workflowName, setWorkflowName] = useState("Kylas Free-Form Workflow");
  const [workflowTrigger, setWorkflowTrigger] = useState("lead.created");
  const [workflowStatus, setWorkflowStatus] = useState("draft");
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [triggerOptions, setTriggerOptions] = useState(DEFAULT_TRIGGER_OPTIONS);
  const [triggerFields, setTriggerFields] = useState(DEFAULT_TRIGGER_FIELDS);
  const [availableWebhooks, setAvailableWebhooks] = useState([]);
  const [availableOutgoingWebhooks, setAvailableOutgoingWebhooks] = useState([]);
  const [invoiceTemplates, setInvoiceTemplates] = useState([]);

  const [nodes, setNodes] = useState([
    { id: "node_1", type: "trigger", title: "Workflow Trigger", x: 40, y: 220, event: "lead.created" }
  ]);

  const [edges, setEdges] = useState([]);

  const [activeTab, setActiveTab] = useState("builder");
  const [saveStatus, setSaveStatus] = useState("All changes saved");
  const canvasRef = useRef(null);

  // Testing & History States
  const [isTestingMode, setIsTestingMode] = useState(false);
  const [testExecution, setTestExecution] = useState(null);
  const [logs, setLogs] = useState([]);
  const [versions, setVersions] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const pollIntervalRef = useRef(null);

  // Fetch Workflow data on mount
  useEffect(() => {
    async function fetchWorkflow() {
      // Fetch incoming webhooks first to populate trigger options
      try {
        const hooksRes = await fetch("/api/webhooks/incoming");
        if (hooksRes.ok) {
          const hooksData = await hooksRes.json();
          if (hooksData && hooksData.length > 0) {
            setAvailableWebhooks(hooksData);
            setTriggerOptions(hooksData.map(h => ({
              label: h.name || "Unnamed Webhook",
              value: h.endpointPath
            })));
          }
        }
      } catch (e) {
        console.error("Failed to load webhooks", e);
      }
      
      // Fetch outgoing webhooks
      try {
        const outHooksRes = await fetch("/api/webhooks/outgoing");
        if (outHooksRes.ok) {
          const outHooksData = await outHooksRes.json();
          if (outHooksData && outHooksData.length > 0) {
            setAvailableOutgoingWebhooks(outHooksData);
          }
        }
      } catch (e) {
        console.error("Failed to load outgoing webhooks", e);
      }

      // Fetch Invoice Templates
      try {
        const tplRes = await fetch("/api/invoices/templates");
        if (tplRes.ok) {
          const tplData = await tplRes.json();
          setInvoiceTemplates(tplData || []);
        }
      } catch (e) {
        console.error("Failed to load templates", e);
      }

      if (!params.id) return;
      if (params.id.startsWith("wf_new_")) {
        setIsFetching(false);
        return;
      }
      setIsFetching(true);
      try {
        const res = await fetch(`/api/workflows/${params.id}`);
        if (!res.ok) throw new Error("Failed to load workflow");
        const data = await res.json();
        
        setWorkflowName(data.name || "Kylas Free-Form Workflow");
        setWorkflowStatus(data.status || "draft");
        
        if (data.config) {
          const parsed = JSON.parse(data.config);
          if (parsed.nodes) setNodes(parsed.nodes);
          if (parsed.edges) setEdges(parsed.edges);
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setIsFetching(false);
      }
    }
    fetchWorkflow();
  }, [params.id]);

  const fetchLogs = async () => {
    if (!params.id || params.id.startsWith("wf_new_")) return;
    try {
      const res = await fetch(`/api/workflows/${params.id}/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error("Failed to fetch logs", e);
    }
  };

  const fetchVersions = async () => {
    if (!params.id) return;
    try {
      const res = await fetch(`/api/workflows/${params.id}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (e) {
      console.error("Failed to fetch versions", e);
    }
  };

  useEffect(() => {
    if (activeTab === "logs") fetchLogs();
    if (activeTab === "versions") fetchVersions();
  }, [activeTab]);

  const getExecutedNodeIds = () => {
    if (!testExecution || !testExecution.logs) return [];
    try {
      const parsedLogs = JSON.parse(testExecution.logs);
      const executedIds = [];
      parsedLogs.forEach(log => {
        const match = log.message.match(/Executing node: (node_\w+)/);
        if (match) {
          executedIds.push(match[1]);
        }
      });
      return executedIds;
    } catch(e) {
      return [];
    }
  };

  const executedNodeIds = getExecutedNodeIds();

  const handleTestWorkflow = async () => {
    if (!params.id) {
      toast.error("Invalid workflow ID.");
      return;
    }
    
    try {
      setIsTestingMode(true);
      setTestExecution(null);
      const testStartTime = Date.now();
      
      const res = await fetch(`/api/workflows/${params.id}/test/init`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to initialize test mode");
      
      toast.success("Testing mode activated. Trigger your webhook now!");

      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/workflows/${params.id}/test/status?since=${testStartTime}`);
          if (pollRes.ok) {
            const data = await pollRes.json();
            if (data.hasResult && data.execution && data.execution.status !== "PENDING_TEST" && data.execution.status !== "RUNNING") {
              // Webhook hit completed
              setTestExecution(data.execution);
              setIsTestingMode(false);
              clearInterval(pollIntervalRef.current);
              toast.success("Webhook hit received and workflow executed!");
              if (activeTab === "logs") fetchLogs();
            }
          }
        } catch (e) {
          console.error("Test polling error", e);
        }
      }, 2000);
      
    } catch (e) {
      toast.error(e.message);
      setIsTestingMode(false);
    }
  };

  const cancelTestWorkflow = () => {
    setIsTestingMode(false);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    toast("Testing cancelled.");
  };

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

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (nodes.length === 0) return;
    
    setSaveStatus("Compiling node modifications...");
    const debounceTimer = setTimeout(async () => {
      try {
        await fetch(`/api/workflows/${params.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: workflowName,
            trigger: workflowTrigger,
            status: workflowStatus,
            nodesCount: nodes.length,
            config: JSON.stringify({ nodes, edges })
          })
        });
        setSaveStatus("Canvas modifications auto-saved to draft");
      } catch (err) {
        setSaveStatus("Failed to auto-save");
      }
    }, 2000);
    return () => clearTimeout(debounceTimer);
  }, [nodes, edges, workflowName, workflowTrigger, workflowStatus, params.id]);

  // Dynamically update available fields in Condition Router based on selected triggers
  useEffect(() => {
    if (availableWebhooks.length === 0) return;
    const activeTriggerEvents = nodes.filter(n => n.type === 'trigger').map(n => n.event);
    
    let allFields = [];
    activeTriggerEvents.forEach(evt => {
      const hook = availableWebhooks.find(h => h.endpointPath === evt);
      if (hook && hook.selectedVariables) {
        try {
          const vars = JSON.parse(hook.selectedVariables);
          if (Array.isArray(vars)) {
            vars.forEach(v => {
              if (v && v.path) {
                if (!allFields.some(f => f.value === `payload.${v.path}`)) {
                  allFields.push({ value: `payload.${v.path}`, label: `${hook.name}: ${v.customName || v.path}` });
                }
              }
            });
          }
        } catch(e) {}
      }
    });

    nodes.filter(n => n.type === 'action' && n.outputVariableName).forEach(n => {
      allFields.push({ 
        value: `step_${n.id}.${n.outputVariableName}`, 
        label: `${n.title || 'Action'}: ${n.outputVariableName}` 
      });
    });

    if (allFields.length === 0) {
      setTriggerFields(DEFAULT_TRIGGER_FIELDS);
    } else {
      setTriggerFields(allFields);
    }
  }, [nodes, availableWebhooks]);

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
    let spawnedNode;
    
    if (type === "condition_router") {
      spawnedNode = { id: nextId, type: "condition_router", title: "Condition Router", x: contextMenu.spawnX, y: contextMenu.spawnY, branches: [{ branchId: `b_${Date.now()}`, name: "Path 1", grouped: true, conditions: { rules: [{ field: "payload.stage", operator: "equals", value: "", joinOperator: "AND" }] } }, { branchId: `bf_${Date.now()}`, name: "Else", isFallback: true, grouped: true }] };
    } else if (type === "trigger") {
      spawnedNode = { id: nextId, type: "trigger", title: "Additional Trigger", x: contextMenu.spawnX, y: contextMenu.spawnY, event: "lead.created" };
    } else if (type === "transform_trim" || type === "transform_concat" || type === "transform_filter") {
      spawnedNode = { id: nextId, type: "action", title: "Data Transform", x: contextMenu.spawnX, y: contextMenu.spawnY, actionType: type, payloadOverrides: [] };
    } else if (type === "generate_invoice") {
      spawnedNode = { id: nextId, type: "generate_invoice", title: "Generate Invoice", x: contextMenu.spawnX, y: contextMenu.spawnY, mappings: {} };
    } else {
      spawnedNode = { id: nextId, type: "action", title: "New Action Step", x: contextMenu.spawnX, y: contextMenu.spawnY, actionType: "api_call", payloadOverrides: [] };
    }

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

  const handleManualSave = async (status = "active") => {
    setSaveStatus("Saving workflow...");
    setIsSaving(true);
    try {
      const triggerNode = nodes.find(n => n.type === "trigger");
      const currentTrigger = triggerNode?.event || workflowTrigger;
      
      const configStr = JSON.stringify({ nodes, edges });
      const res = await fetch(`/api/workflows/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowName,
          trigger: currentTrigger,
          status: status,
          nodesCount: nodes.length,
          config: configStr
        })
      });

      if (!res.ok) throw new Error("Failed to save workflow");
      
      // Auto-save a version
      await fetch(`/api/workflows/${params.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: { nodes, edges },
          description: `User triggered save as ${status}`
        })
      });

      setWorkflowStatus(status);
      setSaveStatus("Workflow successfully saved");
      toast.success(`Workflow configuration has been saved as ${status}.`);
      fetchVersions(); // Refresh versions list
    } catch (err) {
      setSaveStatus("Failed to save");
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
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
                  <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className={styles.headerTitleInput}
                    title="Click to rename workflow"
                    style={{
                      background: "rgba(255, 255, 255, 0.4)",
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                      borderRadius: "6px",
                      outline: "none",
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#1d1d1f",
                      padding: "4px 8px",
                      margin: "0",
                      width: "320px"
                    }}
                  />
                  <span className={styles.statusBadge} style={{ textTransform: "capitalize" }}>{workflowStatus}</span>
                </div>
                <span className={styles.autoSaveLabel}>{saveStatus}</span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <AdminButton variant="secondary" icon={FiPlayCircle} onClick={isTestingMode ? cancelTestWorkflow : handleTestWorkflow} disabled={isSaving}>
                {isTestingMode ? "Listening... (Cancel)" : "Test Workflow"}
              </AdminButton>
              <AdminButton variant="secondary" icon={FiFileText} onClick={() => handleManualSave("draft")} disabled={isSaving || isTestingMode}>
                Save Draft
              </AdminButton>
              <AdminButton variant="primary" icon={FiSave} onClick={() => handleManualSave("active")} disabled={isSaving || isTestingMode}>
                Save Workflow
              </AdminButton>
            </div>
          </header>

          <div className={styles.macOsSegmentedControlContainer}>
            <div className={styles.macOsSegmentedControlBackground}>
              <button className={`${styles.segmentBtn} ${activeTab === "builder" ? styles.segmentActive : ""}`} onClick={() => setActiveTab("builder")}>
                <FiGrid /> Workflow
              </button>
              <button className={`${styles.segmentBtn} ${activeTab === "versions" ? styles.segmentActive : ""}`} onClick={() => setActiveTab("versions")}>
                <FiClock /> Version history
              </button>
              <button className={`${styles.segmentBtn} ${activeTab === "logs" ? styles.segmentActive : ""}`} onClick={() => setActiveTab("logs")}>
                <FiList /> Logs
              </button>
            </div>
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

                  {nodes.map((node) => {
                    const isExecuted = executedNodeIds.includes(node.id);
                    return (
                      <div 
                        key={node.id}
                        className={`${styles.canvasNodeBlockCard} ${styles[`node_${node.type}`]} ${draggingNodeId === node.id ? styles.nodeActiveDraggingState : ""}`}
                        style={{ 
                          left: `${node.x}px`, 
                          top: `${node.y}px`,
                          ...(isExecuted ? { border: '2px solid #10b981', boxShadow: '0 0 15px rgba(16,185,129,0.3)' } : {})
                        }}
                        onMouseDown={(e) => handleNodeDragStart(e, node.id)}
                      >
                      <div className={styles.nodeCardDragHeader}>
                        <div className={styles.nodeCardHeaderLeftTitle}>
                          <FiMove className={styles.dragHandleIconVector} />
                          <h4>{node.title}</h4>
                        </div>
                        {(node.type !== "trigger" || nodes.filter(n => n.type === "trigger").length > 1) && (
                          <button className={styles.deleteNodeBtn} onClick={() => handleDeleteNode(node.id)}><FiX /></button>
                        )}
                      </div>

                      <div className={styles.nodeCardInteriorWorkspace}>
                        {node.type === "trigger" && (
                          <div className={styles.blockFieldRowContent}>
                            <label>Incoming Event Channel</label>
                            <div className="dropdownContainerParent">
                              <Dropdown 
                                options={triggerOptions}
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
                                              options={triggerFields.length > 0 ? triggerFields : DEFAULT_TRIGGER_FIELDS} selectedValue={rule.field}
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

                            {["transform_trim", "transform_concat", "transform_filter", "api_call"].includes(node.actionType) && (
                              <div style={{ marginTop: '8px' }}>
                                <label>Save Output As Variable</label>
                                <input 
                                  type="text" 
                                  className={styles.canvasBlockTextInputCond} 
                                  placeholder="e.g. filtered_array" 
                                  style={{ marginTop: '4px', width: '100%' }}
                                  value={node.outputVariableName || ""} 
                                  onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, outputVariableName: e.target.value } : n))}
                                />
                                <p className={styles.nodeHelpText} style={{ marginTop: '4px' }}>This variable will be available to subsequent blocks.</p>
                              </div>
                            )}

                            <div className={styles.actionPayloadBox}>
                              <div className={styles.actionPayloadHeader}>
                                <span>{node.actionType === 'api_call' ? "Outgoing API Mapping" : "JSON Blueprint Mapping Layer"}</span>
                              </div>
                              
                              {node.actionType === 'api_call' ? (
                                <div className={styles.nestedRulesStack}>
                                  <div className={styles.blockFieldRowContent}>
                                    <label>Select Outgoing API</label>
                                    <div className="dropdownContainerParent">
                                      <Dropdown 
                                        options={availableOutgoingWebhooks.map(h => ({ label: h.name || h.url, value: h.id }))}
                                        selectedValue={node.externalApiId || ""}
                                        onSelect={(val) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, externalApiId: val, mappings: n.mappings || {} } : n))}
                                      />
                                    </div>
                                  </div>
                                  
                                  {node.externalApiId && (() => {
                                    const selectedApi = availableOutgoingWebhooks.find(h => h.id === node.externalApiId);
                                    const apiStr = selectedApi ? ((selectedApi.url || "") + (selectedApi.headers || "") + (selectedApi.bodyPayload || "")) : "";
                                    const extractedTokens = Array.from(new Set([...apiStr.matchAll(/\{\{\s*(?:#each\s+|#with\s+)?([a-zA-Z0-9_.-]+)\s*\}\}/g)].map(m => m[1])));
                                    const nodeFields = getAvailableFieldsForNode(node.id, nodes, edges, availableWebhooks);
                                    
                                    if (extractedTokens.length === 0) {
                                      return (
                                        <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                                          No variables required by this API configuration.
                                        </div>
                                      );
                                    }

                                    return (
                                      <div style={{ marginTop: '12px' }}>
                                        <label>Map Variables</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                                          {extractedTokens.map(token => (
                                            <div key={token} style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
                                              <div style={{ flex: '0 0 calc(50% - 4px)', fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{token}</div>
                                              <div style={{ flex: '0 0 calc(50% - 4px)' }} className="dropdownContainerParent">
                                                <Dropdown 
                                                  options={nodeFields.length > 0 ? nodeFields : [{ label: "No variables available", value: "" }]}
                                                  selectedValue={node.mappings?.[token] || ""}
                                                  onSelect={(val) => setNodes(prev => prev.map(n => n.id === node.id ? { 
                                                    ...n, 
                                                    mappings: { ...(n.mappings || {}), [token]: val } 
                                                  } : n))}
                                                />
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              ) : (
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
                              )}
                            </div>

                            <div 
                              className={styles.socketAnchorPlugSource}
                              data-plug-id={`source-${node.id}-main`}
                              onMouseDown={(e) => handlePlugMouseDown(e, `source-${node.id}-main`, 'source')}
                              onMouseUp={(e) => handlePlugMouseUp(e, `source-${node.id}-main`, 'source')}
                            />
                          </div>
                        )}

                        {node.type === "generate_invoice" && (
                          <div className={styles.blockFieldRowContent}>
                            <label>Invoice Template</label>
                            <div className="dropdownContainerParent">
                              <Dropdown 
                                options={invoiceTemplates.map(t => ({ label: t.name, value: t.id }))}
                                selectedValue={node.templateId || ""}
                                onSelect={(val) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, templateId: val, mappings: n.mappings || {} } : n))}
                              />
                            </div>
                            
                            {node.templateId && (() => {
                              const selectedTemplate = invoiceTemplates.find(t => t.id === node.templateId);
                              const templateStr = selectedTemplate ? ((selectedTemplate.theme || "") + (selectedTemplate.config || "")) : "";
                              const extractedTokens = Array.from(new Set([...templateStr.matchAll(/\{\{\s*(?:#each\s+|#with\s+)?([a-zA-Z0-9_.-]+)\s*\}\}/g)].map(m => m[1])));
                              const displayTokens = extractedTokens.length > 0 ? extractedTokens : ["receipt_no", "date", "customer.name", "customer.phone", "total_amount", "payment_for"];
                              
                              return (
                                <div style={{ marginTop: '12px' }}>
                                  <label>Variable Mappings (Tokens)</label>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                                    {displayTokens.map(token => (
                                      <div key={token} style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
                                        <div style={{ flex: '0 0 calc(50% - 4px)', fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{token}</div>
                                        <div style={{ flex: '0 0 calc(50% - 4px)' }} className="dropdownContainerParent">
                                          <Dropdown 
                                            options={triggerFields.length > 0 ? triggerFields : [{ label: "No variables", value: "" }]}
                                            selectedValue={node.mappings?.[token] || ""}
                                            onSelect={(val) => setNodes(prev => prev.map(n => n.id === node.id ? { 
                                              ...n, 
                                              mappings: { ...(n.mappings || {}), [token]: val } 
                                            } : n))}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                            
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
                    );
                  })}
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
                    <li onClick={() => handleSpawnNodeFromMenu("trigger")}><FiZap /> New Workflow Trigger</li>
                    <li onClick={() => handleSpawnNodeFromMenu("condition_router")}><FiGitBranch /> Condition Router</li>
                    <li onClick={() => handleSpawnNodeFromMenu("action")}><FiPlayCircle /> External Action / API</li>
                    <li className={styles.contextMenuLabel}>Data Transformations</li>
                    <li onClick={() => handleSpawnNodeFromMenu("transform_concat")}><FiPlus /> Concat Variables</li>
                    <li onClick={() => handleSpawnNodeFromMenu("transform_trim")}><FiMinus /> Trim Whitespace</li>
                    <li onClick={() => handleSpawnNodeFromMenu("transform_filter")}><FiList /> Filter Data Array</li>
                    <div style={{ height: '1px', background: '#E2E8F0', margin: '4px 0' }} />
                    <li onClick={() => handleSpawnNodeFromMenu("generate_invoice")}><FiFileText /> Generate Invoice</li>
                  </ul>
                )}
              </div>
            )}

            {activeTab === "versions" && (
              <div className={styles.historyListFrame}>
                <div className={styles.infoAlertBanner}>
                  <FiClock /> <span>Graph compilation engine automatically tracks visual coordinate offsets and node expression logic maps.</span>
                </div>
                <div className={styles.timelineContainer}>
                  {versions.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', marginTop: '20px' }}>No versions saved yet.</p>}
                  {versions.map((ver) => (
                    <div key={ver.id} className={styles.timelineItem}>
                      <div className={styles.timelineMarker}><div className={styles.markerCircle} /><div className={styles.markerLine} /></div>
                      <div className={styles.versionCard}>
                        <div className={styles.versionMetaRow}>
                          <span className={styles.versionBadgeName}>{ver.versionName.toUpperCase()}</span>
                          <span className={styles.versionTimestampStamp}>{new Date(ver.createdAt).toLocaleString()}</span>
                        </div>
                        <p className={styles.versionDescText}>{ver.description}</p>
                        <span className={styles.versionAuthorTag}>Modified by: <strong>{ver.author}</strong></span>
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
                    {logs.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', marginTop: '20px' }}>No logs recorded.</p>}
                    {logs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`${styles.logRowItemSummary} ${selectedLog?.id === log.id ? styles.logRowActiveSelected : ""}`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className={styles.logLeftIndicatorMeta}>
                          {log.status === "SUCCESS" ? <FiCheckCircle className={styles.logSuccessStatusIcon} /> : (log.status === "FAILED" ? <FiAlertCircle className={styles.logFailStatusIcon} /> : <FiClock className={styles.logFailStatusIcon} style={{color: '#3b82f6'}} />)}
                          <div className={styles.logTextLabelStack}>
                            <span className={styles.logEventTitle}>{log.status === "PENDING_TEST" ? "Test Listening" : "Execution"}</span>
                            <span className={styles.logIdHashSub}>{log.id}</span>
                          </div>
                        </div>
                        <span className={styles.logTimeBadgeStamp}>{formatDate(log.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.logPayloadInspectorColumn}>
                  {selectedLog ? (
                    <div className={styles.inspectorCanvasCard}>
                      <div className={styles.inspectorHeaderTitleRow}>
                        <h4>Payload Data Inspector</h4>
                        <span className={`${styles.statusPillLabel} ${selectedLog.status === "SUCCESS" ? styles.pillSuccessColor : (selectedLog.status === "FAILED" ? styles.pillFailColor : "")}`} style={{ backgroundColor: selectedLog.status === "PENDING_TEST" ? "#dbeafe" : undefined, color: selectedLog.status === "PENDING_TEST" ? "#1e40af" : undefined }}>
                          {selectedLog.status.toUpperCase()}
                        </span>
                      </div>
                      <p className={styles.inspectorHelpGuideText}>Review the step-by-step logs and variable context below.</p>
                      
                      <div className={styles.jsonBlockWrapperContainer}>
                        <div className={styles.jsonBlockTitleLabel}><FiCode /> Context Data</div>
                        <pre className={styles.jsonPreformattingBlock}>
                          {(() => {
                            try { return JSON.stringify(JSON.parse(selectedLog.context), null, 2); } 
                            catch(e) { return selectedLog.context; }
                          })()}
                        </pre>
                      </div>

                      <div className={styles.jsonBlockWrapperContainer}>
                        <div className={styles.jsonBlockTitleLabel}><FiGrid /> Execution Trace Logs</div>
                        <pre className={styles.jsonPreformattingBlock}>
                          {(() => {
                            try { return JSON.stringify(JSON.parse(selectedLog.logs), null, 2); } 
                            catch(e) { return selectedLog.logs; }
                          })()}
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