"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FiGitBranch, FiPlus, FiEdit2, FiTrash2, FiMoreVertical, FiSearch, 
  FiChevronLeft, FiChevronRight, FiPlay, FiPause, FiFileText, FiActivity,
  FiAlertTriangle, FiX
} from "react-icons/fi";
import Sidebar from "@/components/layout/sidebar/sidebar";
import AdminButton from "@/components/ui/button/button";
import Dropdown from "@/components/ui/dropdown/dropdown";
import CentralizedModal from "@/components/ui/modal/modal";
import SkeletonLoader from "@/components/ui/skeleton/skeleton";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import styles from "./workflows-list.module.css";



export default function WorkflowsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [triggerFilter, setTriggerFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [workflowToDelete, setWorkflowToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchWorkflows = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/workflows");
      if (!res.ok) throw new Error("Failed to load workflows");
      const data = await res.json();
      setWorkflows(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(`.${styles.actionMenuWrapper}`)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    fetchWorkflows();
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCreateNew = async () => {
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Automation Workflow",
          trigger: "lead.created",
          status: "draft",
          nodesCount: 1,
          config: null
        })
      });
      if (!res.ok) throw new Error("Failed to create workflow");
      const newWf = await res.json();
      router.push(`/workflows/${newWf.id}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEdit = (id) => {
    router.push(`/workflows/${id}`);
  };

  const handleDelete = (id) => {
    setWorkflowToDelete(workflows.find(wf => wf.id === id) || null);
    setOpenMenuId(null);
  };

  const confirmDelete = async () => {
    if (!workflowToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/workflows/${workflowToDelete.id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete workflow");
      setWorkflows(prev => prev.filter(wf => wf.id !== workflowToDelete.id));
      
      const newFilteredLength = workflows.filter(wf => wf.id !== workflowToDelete.id).length;
      if (currentPage > 1 && newFilteredLength <= (currentPage - 1) * itemsPerPage) {
        setCurrentPage(p => p - 1);
      }
      
      setWorkflowToDelete(null);
      toast.success("Workflow deleted successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const changeStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status");
      setWorkflows(prev => prev.map(wf => wf.id === id ? { ...wf, status: newStatus } : wf));
      setOpenMenuId(null);
      toast.success(`Workflow status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.message);
    }
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

  const canEdit = session?.user?.role !== "MARKETING" && session?.user?.role !== "ACCOUNTING";

  return (
    <div className={styles.adminLayout}>
      <Sidebar activeId="workflows" />

      <main className={styles.mainCanvas}>
        <div className={styles.pageMaxWidth}>
          <header className={styles.pageHeader}>
            <div className={styles.headerTitle}>
              <h1>Workflow Automations</h1>
              <p>Manage conditional triggers and Kylas event routing</p>
            </div>
            {canEdit && (
              <div className={styles.headerActions}>
                <AdminButton variant="primary" icon={FiPlus} onClick={handleCreateNew}>
                  Create Automation
                </AdminButton>
              </div>
            )}
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
                    <th>Last Modified</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className={styles.loadingCell}>
                        <div className={styles.spinner} />
                        Loading workflows...
                      </td>
                    </tr>
                  ) : paginatedWorkflows.length === 0 ? (
                    <tr>
                      <td colSpan="6" className={styles.emptyCell}>
                        {searchQuery || triggerFilter !== "all" || statusFilter !== "all"
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
                        <td className={styles.mutedCell}>{wf.nodesCount ?? 0} Nodes</td>
                        <td className={styles.mutedCell}>{formatDate(wf.updatedAt)}</td>
                        <td>
                          <div className={`${styles.statusBadgeView} ${styles[wf.status]}`}>
                            <div className={styles.toggleKnob} />
                            {wf.status === "active" ? "Active" : wf.status === "inactive" ? "Inactive" : "Draft"}
                          </div>
                        </td>
                        <td>
                          <div className={styles.actionsCell}>
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
                                  <button onClick={() => handleEdit(wf.id)}>
                                    {canEdit ? (
                                      <>
                                        <FiEdit2 /> Edit Workflow
                                      </>
                                    ) : (
                                      <>
                                        <FiEdit2 /> View Workflow
                                      </>
                                    )}
                                  </button>
                                  {canEdit && (
                                    <>
                                      {wf.status !== "draft" && (
                                        <button onClick={() => changeStatus(wf.id, "draft")}>
                                          <FiFileText /> Save as Draft
                                        </button>
                                      )}
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
                                      {(session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "DEVELOPER") && (
                                        <button className={styles.dangerText} onClick={() => handleDelete(wf.id)}>
                                          <FiTrash2 /> Delete Workflow
                                        </button>
                                      )}
                                    </>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className={styles.pageInfo}>
                  Showing {filteredWorkflows.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredWorkflows.length)} of {filteredWorkflows.length} entries
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#8c9196', fontFamily: 'var(--font-poppins), sans-serif' }}>Show:</span>
                  <Dropdown 
                    options={[
                      { value: 5, label: "5" },
                      { value: 10, label: "10" },
                      { value: 20, label: "20" },
                      { value: 50, label: "50" },
                      { value: 100, label: "100" }
                    ]} 
                    selectedValue={itemsPerPage} 
                    onSelect={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}
                    triggerClassName={styles.pageSizeDropdownTrigger}
                  />
                </div>
              </div>
              <div className={styles.paginationControls}>
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)} 
                  className={styles.pageBtn}
                  title="Previous Page"
                >
                  <FiChevronLeft className={styles.pageIcon} />
                </button>
                <div className={styles.pageTracker}>Page {currentPage} of {totalPages}</div>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)} 
                  className={styles.pageBtn}
                  title="Next Page"
                >
                  <FiChevronRight className={styles.pageIcon} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* High-Assurance Destructive Confirm Action Modal */}
      <CentralizedModal
        isOpen={workflowToDelete !== null}
        onClose={() => {
          setWorkflowToDelete(null);
          setIsDeleting(false);
        }}
        type="alert"
        variant="destructive"
        size="md"
        icon={<FiAlertTriangle size={20} />}
        title="Confirm Deletion"
        primaryAction={{
          label: "Delete Workflow",
          loadingLabel: "Deleting...",
          icon: <FiTrash2 size={14} />,
          variant: "destructive",
          loading: isDeleting,
          onClick: confirmDelete
        }}
        secondaryAction={{
          label: "Cancel",
          icon: <FiX size={14} />,
          onClick: () => {
            setWorkflowToDelete(null);
            setIsDeleting(false);
          }
        }}
      >
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <p style={{ margin: "0 0 16px 0", color: "#475569", lineHeight: "1.5" }}>
            Are you sure you want to permanently delete the workflow <strong>{workflowToDelete?.name}</strong>?
          </p>
          <p style={{ margin: 0, color: "#64748B", fontSize: "12px" }}>
            This action cannot be undone and will immediately halt any active routing.
          </p>
        </div>
      </CentralizedModal>
    </div>
  );
}