"use client";

import { useReducer, useState } from "react";
import { 
  FiZap, FiGitBranch, FiPlayCircle, FiPlus, 
  FiSave, FiSettings, FiTrash2, FiChevronRight 
} from "react-icons/fi";
import Sidebar from "@/components/layout/sidebar/sidebar";
import AdminButton from "@/components/ui/button/button";
import styles from "./workflows.module.css";

// --- STATE MANAGEMENT ENGINE (The JSON Builder) ---
const INITIAL_WORKFLOW_STATE = {
  workflowId: "wf_draft_01",
  name: "New Kylas Routing Automation",
  isActive: false,
  trigger: { app: "kylas", event: "" },
  nodes: [] 
};

function workflowReducer(state, action) {
  switch (action.type) {
    case "SET_TRIGGER":
      return { ...state, trigger: { ...state.trigger, event: action.payload } };
    
    case "ADD_NODE":
      const newNode = action.payload === "condition" 
        ? {
            nodeId: `router_${Date.now()}`,
            type: "conditional_router",
            branches: [
              { branchId: `branch_${Date.now()}_A`, name: "If condition matches", conditions: { operator: "AND", rules: [] }, actions: [] },
              { branchId: `branch_${Date.now()}_B`, name: "Else", isFallback: true, actions: [] }
            ]
          }
        : {
            nodeId: `action_${Date.now()}`,
            type: "action",
            app: "",
            action: "",
            params: {}
          };
      return { ...state, nodes: [...state.nodes, newNode] };

    case "DELETE_NODE":
      return { ...state, nodes: state.nodes.filter(n => n.nodeId !== action.payload) };

    case "ADD_BRANCH_ACTION":
      return {
        ...state,
        nodes: state.nodes.map(node => {
          if (node.nodeId !== action.payload.nodeId) return node;
          return {
            ...node,
            branches: node.branches.map(branch => {
              if (branch.branchId !== action.payload.branchId) return branch;
              return {
                ...branch,
                actions: [...branch.actions, { actionId: `act_${Date.now()}`, app: "", action: "", params: {} }]
              };
            })
          };
        })
      };

    default:
      return state;
  }
}

// --- MAIN COMPONENT ---
export default function WorkflowsBuilder() {
  const [workflow, dispatch] = useReducer(workflowReducer, INITIAL_WORKFLOW_STATE);
  const [showNodeSelector, setShowNodeSelector] = useState(false);

  // Reusing your global sidebar mapping
  const sidebarMenuItems = [
    { id: "canvas", label: "Overview Canvas", icon: FiSettings, onClick: () => window.location.href = '/dashboard' },
    { id: "workflows", label: "Workflows Builder", icon: FiGitBranch, onClick: null },
  ];

  const handleSave = () => {
    console.log("Saving JSON Payload to Backend:", JSON.stringify(workflow, null, 2));
    alert("Check browser console for the generated JSON structure!");
  };

  return (
    <div className={styles.adminLayout}>
      <Sidebar items={sidebarMenuItems} activeId="workflows" />

      <main className={styles.mainCanvas}>
        <div className={styles.pageMaxWidth}>
          
          <header className={styles.pageHeader}>
            <div className={styles.headerTitle}>
              <h1>{workflow.name}</h1>
              <span className={styles.statusBadge}>Draft</span>
            </div>
            <div className={styles.headerActions}>
              <AdminButton variant="primary" icon={FiSave} onClick={handleSave}>
                Save Workflow
              </AdminButton>
            </div>
          </header>

          <div className={styles.builderCanvas}>
            
            {/* 1. TRIGGER BLOCK */}
            <div className={styles.nodeWrapper}>
              <div className={`${styles.nodeCard} ${styles.triggerCard}`}>
                <div className={styles.nodeHeader}>
                  <div className={styles.nodeIconWrapper}><FiZap /></div>
                  <div className={styles.nodeTitles}>
                    <h3>Workflow Trigger</h3>
                    <p>When should this automation start?</p>
                  </div>
                </div>
                <div className={styles.nodeBody}>
                  <select 
                    className={styles.selectInput}
                    value={workflow.trigger.event}
                    onChange={(e) => dispatch({ type: "SET_TRIGGER", payload: e.target.value })}
                  >
                    <option value="">Select Kylas Event...</option>
                    <option value="lead.created">Lead is Created</option>
                    <option value="lead.updated">Lead is Updated</option>
                    <option value="deal.won">Deal is Won</option>
                  </select>
                </div>
              </div>
              <div className={styles.verticalLine} />
            </div>

            {/* 2. DYNAMIC NODES (Conditions & Actions) */}
            {workflow.nodes.map((node, index) => (
              <div key={node.nodeId} className={styles.nodeWrapper}>
                
                {node.type === "conditional_router" ? (
                  // --- CONDITION ROUTER UI ---
                  <div className={`${styles.nodeCard} ${styles.conditionCard}`}>
                    <div className={styles.nodeHeader}>
                      <div className={styles.nodeIconWrapper}><FiGitBranch /></div>
                      <div className={styles.nodeTitles}>
                        <h3>Condition / Branch</h3>
                        <p>Route leads based on Kylas data</p>
                      </div>
                      <button className={styles.deleteBtn} onClick={() => dispatch({ type: "DELETE_NODE", payload: node.nodeId })}>
                        <FiTrash2 />
                      </button>
                    </div>
                    
                    <div className={styles.branchesContainer}>
                      {node.branches.map((branch, bIndex) => (
                        <div key={branch.branchId} className={styles.branchColumn}>
                          <div className={styles.branchHeader}>
                            {branch.isFallback ? "Else (Fallback)" : `Path ${bIndex + 1}: ${branch.name}`}
                          </div>
                          
                          <div className={styles.branchDropzone}>
                            {branch.actions.map((act, i) => (
                              <div key={act.actionId} className={styles.miniActionCard}>
                                <FiPlayCircle /> Empty Action Setup
                              </div>
                            ))}
                            <button 
                              className={styles.addBranchActionBtn}
                              onClick={() => dispatch({ type: "ADD_BRANCH_ACTION", payload: { nodeId: node.nodeId, branchId: branch.branchId } })}
                            >
                              <FiPlus /> Add Action
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // --- STANDALONE ACTION UI ---
                  <div className={`${styles.nodeCard} ${styles.actionCard}`}>
                    <div className={styles.nodeHeader}>
                      <div className={styles.nodeIconWrapper}><FiPlayCircle /></div>
                      <div className={styles.nodeTitles}>
                        <h3>Execute Action</h3>
                        <p>Perform an action in Kylas or external apps</p>
                      </div>
                      <button className={styles.deleteBtn} onClick={() => dispatch({ type: "DELETE_NODE", payload: node.nodeId })}>
                        <FiTrash2 />
                      </button>
                    </div>
                    <div className={styles.nodeBody}>
                       <div className={styles.emptyStateSetup}>Click to configure action mapping <FiChevronRight/></div>
                    </div>
                  </div>
                )}
                <div className={styles.verticalLine} />
              </div>
            ))}

            {/* 3. ADD NODE SELECTOR */}
            <div className={styles.addNodeWrapper}>
              {!showNodeSelector ? (
                <button className={styles.mainAddBtn} onClick={() => setShowNodeSelector(true)}>
                  <FiPlus />
                </button>
              ) : (
                <div className={styles.nodeSelectorMenu}>
                  <h4>Add Next Step</h4>
                  <div className={styles.selectorGrid}>
                    <button onClick={() => { dispatch({ type: "ADD_NODE", payload: "condition" }); setShowNodeSelector(false); }}>
                      <FiGitBranch className={styles.selIcon} />
                      <span>If / Else Branch</span>
                    </button>
                    <button onClick={() => { dispatch({ type: "ADD_NODE", payload: "action" }); setShowNodeSelector(false); }}>
                      <FiPlayCircle className={styles.selIcon} />
                      <span>Execute Action</span>
                    </button>
                  </div>
                  <button className={styles.cancelBtn} onClick={() => setShowNodeSelector(false)}>Cancel</button>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}