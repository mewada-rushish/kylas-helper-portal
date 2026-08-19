"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/sidebar/sidebar";
import { FiLock, FiCheck, FiLoader, FiAlertCircle, FiUser, FiMail } from "react-icons/fi";
import { useSession, signOut } from "next-auth/react";
import toast from "react-hot-toast";
import styles from "./page.module.css";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Initialize profile form when session is available
  if (status === "authenticated" && !email && session?.user?.email) {
    setEmail(session.user.email);
    setFirstName(session.user.firstName || "");
    setLastName(session.user.lastName || "");
  }

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      
      // Update local NextAuth session cache
      await update();

      toast.success("Profile updated successfully!");
      setIsEditingProfile(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (status === "loading") {
    return (
      <div className={styles.adminLayout}>
        <Sidebar activeId="profile" />
        <main className={styles.mainCanvas}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "70vh", gap: "16px" }}>
            <div className="page-loader-spinner" />
            <span className="page-loader-text">Loading profile...</span>
          </div>
        </main>
      </div>
    );
  }

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

          <div className={styles.premiumDashboardFormGridCanvas}>
            {/* User Info Section */}
            <section className={styles.formSectionGridBlockCard}>
              <div className={styles.sectionHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2>Account Details</h2>
                  <p>Your current session information.</p>
                </div>
                <span className={styles.infoBadge}>{session?.user?.role || "Unknown"}</span>
              </div>
              
              <div className={styles.sectionBody}>
                {!isEditingProfile ? (
                  <>
                    <div className={styles.infoGroup}>
                      <span className={styles.infoLabel}>Name</span>
                      <span className={styles.infoValue}>
                        {(session?.user?.firstName || session?.user?.lastName) 
                          ? `${session?.user?.firstName || ''} ${session?.user?.lastName || ''}`.trim() 
                          : "Not set"}
                      </span>
                    </div>
                    <div className={styles.infoGroup}>
                      <span className={styles.infoLabel}>Email</span>
                      <span className={styles.infoValue}>{session?.user?.email || "Loading..."}</span>
                    </div>
                    <div className={styles.infoGroup} style={{ justifyContent: "flex-end", gridColumn: "1 / -1" }}>
                      <button 
                        onClick={() => setIsEditingProfile(true)} 
                        className={styles.saveButtonSecondary} 
                        style={{ marginTop: "8px" }}
                      >
                        Edit Profile
                      </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "16px", gridColumn: "1 / -1" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div className={styles.inputGroup}>
                        <label>First Name</label>
                        <div className={styles.inputWrapper}>
                          <FiUser className={styles.inputIcon} />
                          <input 
                            type="text" 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="e.g. John"
                            disabled={isSavingProfile}
                          />
                        </div>
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Last Name</label>
                        <div className={styles.inputWrapper}>
                          <FiUser className={styles.inputIcon} />
                          <input 
                            type="text" 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="e.g. Doe"
                            disabled={isSavingProfile}
                          />
                        </div>
                      </div>
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Email Address</label>
                      <div className={styles.inputWrapper}>
                        <FiMail className={styles.inputIcon} />
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          disabled={isSavingProfile}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                      <button 
                        type="submit" 
                        className={styles.saveButton}
                        disabled={isSavingProfile || !email}
                      >
                        {isSavingProfile ? <><FiLoader className={styles.spinAnimation} /> Saving...</> : "Save Changes"}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsEditingProfile(false);
                          setEmail(session?.user?.email || "");
                          setFirstName(session?.user?.firstName || "");
                          setLastName(session?.user?.lastName || "");
                        }}
                        className={styles.saveButtonSecondary}
                        disabled={isSavingProfile}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>

            {/* Change Password Section */}
            <section className={styles.formSectionGridBlockCard}>
              <div className={styles.sectionHeader}>
                <h2>Change Password</h2>
                <p>Ensure your account is using a long, random password to stay secure.</p>
              </div>
              <div className={styles.sectionBody}>
                <form onSubmit={handlePasswordChange} className={styles.passwordForm} style={{ gridColumn: "1 / -1" }}>
                  
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

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
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
