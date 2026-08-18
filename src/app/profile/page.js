"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/sidebar/sidebar";
import { FiLock, FiCheck, FiLoader, FiAlertCircle } from "react-icons/fi";
import { useSession, signOut } from "next-auth/react";
import toast from "react-hot-toast";
import styles from "./page.module.css";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/users/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      toast.success("Password updated successfully! Please log in again.");
      setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, 2000);
      
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.adminLayout}>
      <Sidebar activeId="profile" />
      <main className={styles.mainCanvas}>
        <div className={styles.pageMaxWidth}>
          <header className={styles.pageHeader}>
            <div className={styles.headerTitle}>
              <h1>My Profile</h1>
              <p>Manage your account settings and security.</p>
            </div>
          </header>

          <div className={styles.profileContent}>
            {/* User Info Section */}
            <section className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <h2>Account Details</h2>
                <p>Your current session information.</p>
              </div>
              <div className={styles.sectionBody}>
                <div className={styles.infoGroup}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>{session?.user?.email || "Loading..."}</span>
                </div>
                <div className={styles.infoGroup}>
                  <span className={styles.infoLabel}>Role</span>
                  <span className={styles.infoBadge}>{session?.user?.role || "Unknown"}</span>
                </div>
              </div>
            </section>

            {/* Change Password Section */}
            <section className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <h2>Change Password</h2>
                <p>Ensure your account is using a long, random password to stay secure.</p>
              </div>
              <div className={styles.sectionBody}>
                <form onSubmit={handlePasswordChange} className={styles.passwordForm}>
                  
                  <div className={styles.inputGroup}>
                    <label>Current Password</label>
                    <div className={styles.inputWrapper}>
                      <FiLock className={styles.inputIcon} />
                      <input 
                        type="password" 
                        required 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>New Password</label>
                    <div className={styles.inputWrapper}>
                      <FiLock className={styles.inputIcon} />
                      <input 
                        type="password" 
                        required 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Confirm New Password</label>
                    <div className={styles.inputWrapper}>
                      <FiCheck className={styles.inputIcon} />
                      <input 
                        type="password" 
                        required 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className={styles.saveButton}
                    disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {isLoading ? (
                      <><FiLoader className={styles.spinAnimation} /> Updating...</>
                    ) : (
                      "Update Password"
                    )}
                  </button>

                </form>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
