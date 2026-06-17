"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FiLayout, FiGitBranch, FiSettings, FiCreditCard, FiActivity,
  FiPlus, FiEdit2, FiTrash2, FiMoreVertical, FiSearch, 
  FiChevronLeft, FiChevronRight, FiPlay, FiPause, FiFileText
} from "react-icons/fi";
import Sidebar from "@/components/layout/sidebar/sidebar";
import AdminButton from "@/components/ui/button/button";
import Dropdown from "@/components/ui/dropdown/dropdown";
import styles from "./workflows-list.module.css";

const MOCK_WORKFLOWS = [
  { id: "wf_101", name: "High-Value Deal Routing", trigger: "deal.won", status: "active", nodes: 4, lastUpdated: "2026-06-16T10:30:00Z" },
  { id: "wf_102", name: "Website Lead Distribution", trigger: "lead.created", status: "active", nodes: 6, lastUpdated: "2026-06-15T14:20:00Z" },
  { id: "wf_103", name: "VIP Customer Welcome", trigger: "contact.updated", status: "draft", nodes: 2, lastUpdated: "2026-06-10T09:15:00Z" },
  { id: "wf_104", name: "Inactive Campaign Cleanup", trigger: "deal.lost", status: "inactive", nodes: 3, lastUpdated: "2026-06-08T11:00:00Z" },
  { id: "wf_105", name: "New Employee Onboarding", trigger: "user.created", status: "active", nodes: 8, lastUpdated: "2026-06-05T16:45:00Z" },
  { id: "wf_106", name: "Weekly Report Generation", trigger: "schedule.weekly", status: "active", nodes: 1, lastUpdated: "2026-06-01T08:00:00Z" },
  { id: "wf_107", name: "Support Ticket Escalation", trigger: "ticket.created", status: "draft", nodes: 5, lastUpdated: "2026-05-28T13:30:00Z" },
];

export default function WorkflowsDirectory() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState(MOCK_WORKFLOWS);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [triggerFilter, setTriggerFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  
  const itemsPerPage = 5;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(`.${styles.actionMenuWrapper}`)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sidebarMenuItems = [
    { id: "canvas", label: "Overview Canvas", icon: FiLayout, onClick: () => router.push('/dashboard') },
    { id: "workflows", label: "Workflows Builder", icon: FiGitBranch, onClick: null },
    { id: "invoices", label: "Invoices & ERP", icon: FiCreditCard, onClick: () => router.push('/dashboard') },
    { id: "settings", label: "Settings", icon: FiSettings, disabled: true }
  ];

  const handleCreateNew = () => {
    const newDraftId = `wf_new_${Date.now()}`;
    router.push(`/workflows/${newDraftId}`);
  };

  const handleEdit = (id) => {
    router.push(`/workflows/${id}`);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to permanently delete this workflow?")) {
      setWorkflows(prev => prev.filter(wf => wf.id !== id));
      
      const newFilteredLength = workflows.filter(wf => wf.id !== id).length;
      if (currentPage > 1 && newFilteredLength <= (currentPage - 1) * itemsPerPage) {
        setCurrentPage(p => p - 1);
      }
    }
    setOpenMenuId(null);
  };

  const changeStatus = (id, newStatus) => {
    setWorkflows(prev => prev.map(wf => wf.id === id ? { ...wf, status: newStatus } : wf));
    setOpenMenuId(null);
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    });
  };

  const filteredWorkflows = workflows.filter(wf => {
    const matchesSearch = wf.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          wf.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          wf.trigger.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || wf.status === statusFilter;
    const matchesTrigger = triggerFilter === "all" || wf.trigger === triggerFilter;
    
    return matchesSearch && matchesStatus && matchesTrigger;
  });

  const totalPages = Math.max(1, Math.ceil(filteredWorkflows.length / itemsPerPage));
  const paginatedWorkflows = filteredWorkflows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const statusOptions = [
    { label: "All Statuses", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Draft", value: "draft" }
  ];

  const uniqueTriggers = Array.from(new Set(workflows.map(w => w.trigger)));
  const triggerOptions = [
    { label: "All Triggers", value: "all" },
    ...uniqueTriggers.map(t => ({ label: t, value: t }))
  ];

  return (
    <div className={styles.adminLayout}>
      <Sidebar items={sidebarMenuItems} activeId="workflows" />

      <main className={styles.mainCanvas}>
        <div className={styles.pageMaxWidth}>
          <header className={styles.pageHeader}>
            <div className={styles.headerTitle}>
              <h1>Workflow Automations</h1>
              <p>Manage conditional triggers and Kylas event routing</p>
            </div>
            <div className={styles.headerActions}>
              <AdminButton variant="primary" icon={FiPlus} onClick={handleCreateNew}>
                Create Automation
              </AdminButton>
            </div>
          </header>

          <div className={styles.tableContainer}>
            <div className={styles.tableToolbar}>
              <div className={styles.searchWrapper}>
                <FiSearch className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search by name, ID, or trigger..." 
                  value={searchQuery} 
                  onChange={handleSearchChange} 
                  className={styles.searchInput} 
                />
              </div>
              <div className={styles.filtersWrapper}>
                <Dropdown 
                  options={triggerOptions} 
                  selectedValue={triggerFilter} 
                  onSelect={(val) => { setTriggerFilter(val); setCurrentPage(1); }} 
                />
                <Dropdown 
                  options={statusOptions} 
                  selectedValue={statusFilter} 
                  onSelect={(val) => { setStatusFilter(val); setCurrentPage(1); }} 
                />
              </div>
            </div>

            <div className={styles.tableOverflow}>
              <table className={styles.workflowTable}>
                <thead>
                  <tr>
                    <th>Automation Name</th>
                    <th>Kylas Trigger</th>
                    <th>Complexity</th>
                    <th>Last Updated</th>
                    <th>Status</th>
                    <th className={styles.textRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedWorkflows.length === 0 ? (
                    <tr>
                      <td colSpan="6" className={styles.emptyState}>
                        {searchQuery || statusFilter !== "all" || triggerFilter !== "all"
                          ? "No workflows match your search filters." 
                          : "No workflows found. Create one to automate Kylas actions."}
                      </td>
                    </tr>
                  ) : (
                    paginatedWorkflows.map((wf) => (
                      <tr key={wf.id}>
                        <td className={styles.primaryCell}>
                          <span className={styles.wfName}>{wf.name}</span>
                          <span className={styles.wfId}>{wf.id}</span>
                        </td>
                        <td>
                          <span className={styles.triggerBadge}><FiActivity /> {wf.trigger}</span>
                        </td>
                        <td className={styles.mutedCell}>{wf.nodes} Nodes</td>
                        <td className={styles.mutedCell}>{formatDate(wf.lastUpdated)}</td>
                        <td>
                          <div className={`${styles.statusBadgeView} ${styles[wf.status]}`}>
                            <div className={styles.toggleKnob} />
                            {wf.status === "active" ? "Active" : wf.status === "inactive" ? "Inactive" : "Draft"}
                          </div>
                        </td>
                        <td>
                          <div className={styles.actionsCell}>
                            <button className={styles.iconBtn} onClick={() => handleEdit(wf.id)} title="Edit Workflow">
                              <FiEdit2 />
                            </button>
                            <button className={`${styles.iconBtn} ${styles.dangerBtn}`} onClick={() => handleDelete(wf.id)} title="Delete Workflow">
                              <FiTrash2 />
                            </button>
                            
                            <div className={styles.actionMenuWrapper}>
                              <button 
                                className={`${styles.iconBtn} ${openMenuId === wf.id ? styles.iconBtnActive : ""}`} 
                                title="More Options"
                                onClick={() => setOpenMenuId(openMenuId === wf.id ? null : wf.id)}
                              >
                                <FiMoreVertical />
                              </button>
                              
                              {openMenuId === wf.id && (
                                <div className={styles.actionDropdown}>
                                  {wf.status === "draft" && (
                                    <button onClick={() => changeStatus(wf.id, "active")}>
                                      <FiPlay /> Publish Workflow
                                    </button>
                                  )}
                                  {wf.status === "inactive" && (
                                    <button onClick={() => changeStatus(wf.id, "active")}>
                                      <FiPlay /> Enable Workflow
                                    </button>
                                  )}
                                  {wf.status === "active" && (
                                    <button className={styles.dangerText} onClick={() => changeStatus(wf.id, "inactive")}>
                                      <FiPause /> Disable Workflow
                                    </button>
                                  )}
                                  {wf.status !== "draft" && (
                                    <button onClick={() => changeStatus(wf.id, "draft")}>
                                      <FiFileText /> Save as Draft
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.paginationWrapper}>
              <span className={styles.pageInfo}>
                Showing {filteredWorkflows.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredWorkflows.length)} of {filteredWorkflows.length} entries
              </span>
              <div className={styles.paginationControls}>
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)} 
                  className={styles.pageBtn}
                >
                  <FiChevronLeft className={styles.pageIcon} /> Prev
                </button>
                <div className={styles.pageTracker}>Page {currentPage} of {totalPages}</div>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)} 
                  className={styles.pageBtn}
                >
                  Next <FiChevronRight className={styles.pageIcon} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}