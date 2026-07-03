"use client";

import { useState, useEffect } from "react";
import { FiPlus, FiEdit, FiKey, FiTrash2, FiCheck, FiX, FiShield } from "react-icons/fi";
import toast from "react-hot-toast";
import Sidebar from "@/components/layout/sidebar/sidebar";
import styles from "./page.module.css";

const ALL_MODULES = [
  { id: "/dashboard", label: "Dashboard" },
  { id: "/workflows", label: "Workflows" },
  { id: "/invoices", label: "Invoices" },
  { id: "/settings", label: "Settings" }
];

const ROLES = [
  "META_MARKETING",
  "ACCOUNTING",
  "WEB_DEVELOPER",
  "SUPER_ADMIN",
  "DEVELOPER"
];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  
  // Forms
  const [newUser, setNewUser] = useState({ email: "", password: "", role: "META_MARKETING", customAccess: [] });
  const [selectedUser, setSelectedUser] = useState(null);

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
    e.preventDefault();
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
      setNewUser({ email: "", password: "", role: "META_MARKETING", customAccess: [] });
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateAccess = async (e) => {
    e.preventDefault();
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
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete user");
      }
      toast.success("User deleted");
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const generateResetLink = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}/reset`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate link");
      const data = await res.json();
      await navigator.clipboard.writeText(data.resetLink);
      toast.success("Reset link copied to clipboard!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleCustomAccess = (moduleId, stateSetter, stateObj) => {
    const currentAccess = stateObj.customAccess ? (typeof stateObj.customAccess === 'string' ? JSON.parse(stateObj.customAccess) : stateObj.customAccess) : [];
    const newAccess = currentAccess.includes(moduleId)
      ? currentAccess.filter(id => id !== moduleId)
      : [...currentAccess, moduleId];
    stateSetter({ ...stateObj, customAccess: newAccess });
  };

  if (isLoading) {
    return (
      <div className={styles.adminLayout}>
        <Sidebar activeId="users" />
        <main className={styles.mainCanvas}>
          <div className={styles.pageMaxWidth}>
            <div className={styles.loadingState}>Loading users...</div>
          </div>
        </main>
      </div>
    );
  }

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
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>
                  <span className={styles.roleBadge}>{user.role}</span>
                </td>
                <td>
                  {user.customAccess && JSON.parse(user.customAccess).length > 0 ? (
                    <span className={styles.customBadge}>
                      <FiShield /> {JSON.parse(user.customAccess).length} modules
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
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete User"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Create New User</h2>
            <form onSubmit={handleCreateUser}>
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
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  {ROLES.map(role => <option key={role} value={role}>{role.replace("_", " ")}</option>)}
                </select>
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

              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.primaryButton}>Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ACCESS MODAL */}
      {isAccessModalOpen && selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Edit Access for {selectedUser.email}</h2>
            <form onSubmit={handleUpdateAccess}>
              <div className={styles.inputGroup}>
                <label>Base Role</label>
                <select value={selectedUser.role} onChange={e => setSelectedUser({...selectedUser, role: e.target.value})}>
                  {ROLES.map(role => <option key={role} value={role}>{role.replace("_", " ")}</option>)}
                </select>
              </div>
              
              <div className={styles.customAccessSection}>
                <label>Custom Access Overrides</label>
                <p className={styles.helpText}>Selecting these will grant access even if their base role doesn't allow it.</p>
                <div className={styles.checkboxGrid}>
                  {ALL_MODULES.map(module => {
                    const currentAccess = selectedUser.customAccess ? (typeof selectedUser.customAccess === 'string' ? JSON.parse(selectedUser.customAccess) : selectedUser.customAccess) : [];
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

              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setIsAccessModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.primaryButton}>Save Access</button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}
