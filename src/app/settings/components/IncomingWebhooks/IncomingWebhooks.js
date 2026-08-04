"use client";

import React, { useState, useEffect } from "react";
import { FiSave, FiCopy, FiLoader, FiShield } from "react-icons/fi";
import CustomDropdown from "@/components/ui/dropdown/dropdown";
import toast from "react-hot-toast";
import styles from "../WorkflowSettings/WorkflowSettings.module.css"; // Reuse existing styles

export default function IncomingWebhooks() {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Default values for a new setup
  const [authType, setAuthType] = useState("NO_AUTH");
  const [authToken, setAuthToken] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/settings/incoming-webhooks");
        if (res.ok) {
          const data = await res.json();
          const kylasConfig = data.find(c => c.provider === "KYLAS");
          if (kylasConfig) {
            setConfig(kylasConfig);
            setAuthType(kylasConfig.authType);
            setAuthToken(kylasConfig.authToken || "");
            setIsActive(kylasConfig.isActive);
          }
        }
      } catch (error) {
        console.error("Failed to load incoming webhooks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/incoming-webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "KYLAS",
          endpointPath: "/api/webhooks/kylas",
          authType,
          authToken,
          isActive
        })
      });
      if (!res.ok) throw new Error("Failed to save configuration");
      toast.success("Webhook receiver configuration saved!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/kylas` : '/api/webhooks/kylas';

  if (isLoading) {
    return <div style={{ padding: "40px", textAlign: "center" }}><FiLoader className={styles.spinIcon} size={24} /></div>;
  }

  return (
    <div className={styles.workflowsMainWorkspaceNode}>
      <div className={styles.fullWidthListContainer}>
        
        <div className={styles.centeredRegistryHeader} style={{ marginBottom: "24px" }}>
          <h4>Incoming Webhook Receiver</h4>
          <p>Configure security and retrieve the URL for systems like Kylas to push data to your portal.</p>
        </div>

        <div style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
          
          <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h5 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>Endpoint URL</h5>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>Paste this URL into the external system (e.g., Kylas portal).</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <code style={{ backgroundColor: "#FFFFFF", padding: "10px 16px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "13px", color: "#334155", userSelect: "all" }}>
                {webhookUrl}
              </code>
              <button 
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  toast.success("Webhook URL copied to clipboard!");
                }}
                style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#0F172A", color: "white", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}
              >
                <FiCopy size={14} /> Copy URL
              </button>
            </div>
          </div>

          <hr style={{ border: "0", borderTop: "1px solid #E2E8F0", margin: "0 0 24px 0" }} />

          <div style={{ marginBottom: "24px" }}>
             <h5 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "600", color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
              <FiShield /> Security & Authentication
             </h5>
             
             <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
               <div style={{ flex: 1 }}>
                 <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Authentication Type</label>
                 <CustomDropdown 
                    options={[
                      { label: "No Authentication", value: "NO_AUTH" },
                      { label: "Bearer Token", value: "BEARER_TOKEN" }
                    ]}
                    selectedValue={authType}
                    onSelect={(val) => setAuthType(val)}
                  />
               </div>

               {authType === "BEARER_TOKEN" && (
                 <div style={{ flex: 2 }}>
                   <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Expected Token Secret</label>
                   <input 
                     type="text"
                     value={authToken}
                     onChange={(e) => setAuthToken(e.target.value)}
                     placeholder="e.g. sk_live_123456789"
                     style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "13px", outline: "none" }}
                   />
                   <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "#64748B" }}>Incoming requests must include the header: <code>Authorization: Bearer {authToken || "..."}</code></p>
                 </div>
               )}
             </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button 
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#3B82F6", color: "white", border: "none", padding: "10px 24px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}
            >
              {isSaving ? <FiLoader className={styles.spinIcon} size={14} /> : <FiSave size={14} />} Save Configuration
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
