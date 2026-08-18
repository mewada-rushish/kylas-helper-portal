"use client";

import { useState, useEffect } from "react";
import { FiPlus, FiEdit, FiKey, FiTrash2, FiCheck, FiX, FiShield, FiAlertTriangle } from "react-icons/fi";
import toast from "react-hot-toast";
import Sidebar from "@/components/layout/sidebar/sidebar";
import SkeletonLoader from "@/components/ui/skeleton/skeleton";
import CentralizedModal from "@/components/ui/modal/modal";
import CustomDropdown from "@/components/ui/dropdown/dropdown";
import { useSession } from "next-auth/react";
import styles from "./page.module.css";

const ALL_MODULES = [
  { id: "/dashboard", label: "Dashboard" },
  { id: "/workflows", label: "Workflows" },
  { id: "/invoices", label: "Invoices" },
  { id: "/settings", label: "Settings" }
];

const ROLES = [
  "MARKETING",
  "ACCOUNTING",
  "AUTOMATION_ENGINEER",
  "SUPER_ADMIN",
  "DEVELOPER"
];

const roleOptions = ROLES.map(role => ({
  value: role,
  label: role.replace("_", " ")
}));

const getCustomAccessArray = (customAccess) => {
  if (!customAccess) return [];
  try {
    if (typeof customAccess === 'string') {
      const parsed = JSON.parse(customAccess);
      return Array.isArray(parsed) ? parsed : [];
    }
    return Array.isArray(customAccess) ? customAccess : [];
  } catch (e) {
    console.error("Error parsing customAccess:", e);
    return [];
  }
};

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  
  // Forms
  const [newUser, setNewUser] = useState({ email: "", password: "", role: "MARKETING", customAccess: [] });
  const [selectedUser, setSelectedUser] = useState(null);

  // Deletion States
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newUser.email || !newUser.password) {
      toast.error("Email and password are required");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create user");
      }
      toast.success("User created successfully");
      setIsCreateModalOpen(false);
      setNewUser({ email: "", password: "", role: "MARKETING", customAccess: [] });
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateAccess = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSavingAccess(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedUser.role,
          customAccess: selectedUser.customAccess
        })
      });
      if (!res.ok) throw new Error("Failed to update access");
      toast.success("Access updated successfully");
      setIsAccessModalOpen(false);
      fetchUsers();
      if (selectedUser.email === session?.user?.email) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSavingAccess(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete user");
      }
      toast.success("User deleted successfully");
      setUserToDelete(null);
      setDeleteConfirmationText("");
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for HTTP / non-secure contexts
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return Promise.resolve();
  };

  const generateResetLink = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}/reset`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate link");
      const data = await res.json();
      await copyToClipboard(data.resetLink);
      toast.success("Reset link copied to clipboard!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleCustomAccess = (moduleId, stateSetter, stateObj) => {
    const currentAccess = getCustomAccessArray(stateObj.customAccess);
    const newAccess = currentAccess.includes(moduleId)
      ? currentAccess.filter(id => id !== moduleId)
      : [...currentAccess, moduleId];
    stateSetter({ ...stateObj, customAccess: newAccess });
  };



  return (
    <div className={styles.adminLayout}>
      <Sidebar activeId="users" />
      <main className={styles.mainCanvas}>
        <div className={styles.pageMaxWidth}>
          <header className={styles.pageHeader}>
            <div className={styles.headerTitle}>
              <h1>User Management & RBAC</h1>
              <p>Control access, assign roles, and generate password resets.</p>
            </div>
            <button className={styles.primaryButton} onClick={() => setIsCreateModalOpen(true)}>
              <FiPlus /> New User
            </button>
          </header>

      <div className={styles.tableContainer}>
        <table className={styles.usersTable}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Custom Overrides</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonLoader type="table" rows={4} columns={4} />
            ) : (
              users.map(user => (
                <tr key={user.id}>
                <td>{user.email}</td>
                <td>
                  <span className={styles.roleBadge}>{user.role}</span>
                </td>
                <td>
                  {getCustomAccessArray(user.customAccess).length > 0 ? (
                    <span className={styles.customBadge}>
                      <FiShield /> {getCustomAccessArray(user.customAccess).length} modules
                    </span>
                  ) : (
                    <span className={styles.mutedText}>None</span>
                  )}
                </td>
                <td>
                  <div className={styles.actionButtons}>
                    <button 
                      className={styles.iconButton} 
                      onClick={() => { setSelectedUser(user); setIsAccessModalOpen(true); }}
                      title="Edit Access"
                    >
                      <FiEdit />
                    </button>
                    <button 
                      className={styles.iconButton} 
                      onClick={() => generateResetLink(user.id)}
                      title="Generate Reset Link"
                    >
                      <FiKey />
                    </button>
                    <button 
                      className={`${styles.iconButton} ${styles.danger}`} 
                      onClick={() => { setUserToDelete(user); setDeleteConfirmationText(""); }}
                      title={user.email === session?.user?.email ? "You cannot delete your own account" : "Delete User"}
                      disabled={user.email === session?.user?.email}
                      style={user.email === session?.user?.email ? { opacity: 0.35, cursor: "not-allowed" } : {}}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* CREATE USER MODAL */}
      <CentralizedModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User"
        type="content"
        size="md"
        primaryAction={{
          label: "Create User",
          loadingLabel: "Creating...",
          icon: <FiPlus size={14} />,
          loading: isCreating,
          onClick: handleCreateUser
        }}
        secondaryAction={{
          label: "Cancel",
          icon: <FiX size={14} />,
          onClick: () => setIsCreateModalOpen(false)
        }}
      >
        <div className={styles.inputGroup}>
          <label>Email</label>
          <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
        </div>
        <div className={styles.inputGroup}>
          <label>Temporary Password</label>
          <input type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
        </div>
        <div className={styles.inputGroup}>
          <label>Base Role</label>
          <CustomDropdown 
            options={roleOptions}
            selectedValue={newUser.role}
            onSelect={val => setNewUser({...newUser, role: val})}
          />
        </div>
        
        <div className={styles.customAccessSection}>
          <label>Custom Access Overrides (Optional)</label>
          <div className={styles.checkboxGrid}>
            {ALL_MODULES.map(module => {
              const isChecked = newUser.customAccess.includes(module.id);
              return (
                <label key={module.id} className={`${styles.accessCard} ${isChecked ? styles.active : ""}`}>
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    onChange={() => toggleCustomAccess(module.id, setNewUser, newUser)}
                  />
                  <div className={styles.accessCardContent}>
                    <span className={styles.accessCardTitle}>{module.label}</span>
                    <span className={styles.accessCardDesc}>Override to force access to {module.label.toLowerCase()}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </CentralizedModal>

      {/* EDIT ACCESS MODAL */}
      <CentralizedModal
        isOpen={isAccessModalOpen && selectedUser !== null}
        onClose={() => setIsAccessModalOpen(false)}
        title={`Edit Access for ${selectedUser?.email?.toLowerCase()}`}
        type="content"
        size="md"
        primaryAction={{
          label: "Save Access",
          loadingLabel: "Saving...",
          icon: <FiCheck size={14} />,
          loading: isSavingAccess,
          onClick: handleUpdateAccess
        }}
        secondaryAction={{
          label: "Cancel",
          icon: <FiX size={14} />,
          onClick: () => setIsAccessModalOpen(false)
        }}
      >
        {selectedUser && (
          <>
            <div className={styles.inputGroup}>
              <label>Base Role</label>
              {selectedUser.email === session?.user?.email ? (
                <div style={{
                  padding: "10px 14px",
                  backgroundColor: "rgba(0, 0, 0, 0.03)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  cursor: "not-allowed"
                }}>
                  {selectedUser.role.replace("_", " ")} <span style={{ fontSize: "12px", marginLeft: "6px" }}>(Cannot change your own role)</span>
                </div>
              ) : (
                <CustomDropdown 
                  options={roleOptions}
                  selectedValue={selectedUser.role}
                  onSelect={val => setSelectedUser({...selectedUser, role: val})}
                />
              )}
            </div>
            
            <div className={styles.customAccessSection}>
              <label>Custom Access Overrides</label>
              <p className={styles.helpText}>Selecting these will grant access even if their base role doesn't allow it.</p>
              <div className={styles.checkboxGrid}>
                {ALL_MODULES.map(module => {
                  const currentAccess = getCustomAccessArray(selectedUser.customAccess);
                  const isChecked = currentAccess.includes(module.id);
                  return (
                    <label key={module.id} className={`${styles.accessCard} ${isChecked ? styles.active : ""}`}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => toggleCustomAccess(module.id, setSelectedUser, selectedUser)}
                      />
                      <div className={styles.accessCardContent}>
                        <span className={styles.accessCardTitle}>{module.label}</span>
                        <span className={styles.accessCardDesc}>Override to force access to {module.label.toLowerCase()}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CentralizedModal>

      {/* High-Assurance Destructive Confirm Action Modal Platform Overlay */}
      <CentralizedModal
        isOpen={userToDelete !== null}
        onClose={() => {
          setUserToDelete(null);
          setDeleteConfirmationText("");
          setIsDeleting(false);
        }}
        type="alert"
        variant="destructive"
        size="md"
        icon={<FiAlertTriangle size={20} />}
        title="Confirm User Deletion"
        primaryAction={{
          label: "Delete User",
          loadingLabel: "Deleting...",
          icon: <FiTrash2 size={14} />,
          variant: "destructive",
          loading: isDeleting,
          disabled: deleteConfirmationText.trim().toLowerCase() !== userToDelete?.email?.toLowerCase(),
          onClick: handleDeleteUser
        }}
        secondaryAction={{
          label: "Cancel",
          icon: <FiX size={14} />,
          onClick: () => {
            setUserToDelete(null);
            setDeleteConfirmationText("");
            setIsDeleting(false);
          }
        }}
      >
        <div className={styles.modalDeletionSafetyBodyScopeBox}>
          <p className={styles.modalDeletionSafetyDescription}>
            This action is irreversible. To confirm deletion of this user account, please type their email address below:
          </p>
          <div className={styles.modalVerificationTargetCodeBadgeReadout}>
            {userToDelete?.email?.toLowerCase()}
          </div>
          <div className={styles.inputGroup} style={{ gap: "6px" }}>
            <label style={{ color: "#475569" }}>
              User Email
            </label>
            <input
              type="text"
              style={{ borderColor: deleteConfirmationText.trim().toLowerCase() === userToDelete?.email?.toLowerCase() ? "#34c759" : "var(--border-color)" }}
              placeholder="Type the email address to confirm"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      </CentralizedModal>

        </div>
      </main>
    </div>
  );
}
