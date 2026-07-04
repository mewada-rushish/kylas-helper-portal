"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import React, { Suspense } from "react";
import { FiCheck, FiSliders, FiFileText, FiGitBranch, FiActivity } from "react-icons/fi";
import Sidebar from "@/components/layout/sidebar/sidebar";
import AdminButton from "@/components/ui/button/button";
import toast from "react-hot-toast";
import styles from "./settings.module.css";

// Decoupled Sub-Page Feature Component Folders
import GeneralSettings from "./components/GeneralSettings/GeneralSettings";
import TemplateGeometry from "./components/TemplateGeometry/TemplateGeometry";
import WorkflowSettings from "./components/WorkflowSettings/WorkflowSettings";
import SystemLogs from "./components/SystemLogs/SystemLogs";

function SettingsDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const activeTab = searchParams.get("tab") || "general";

  const setActiveTab = (tab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Deterministic UI view renderer switcher map
  const renderActiveSubPage = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "templates":
        return <TemplateGeometry />;
      case "workflows":
        return <WorkflowSettings />;
      case "logs":
        return <SystemLogs />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className={styles.adminLayout}>
      <Sidebar activeId="settings" />
      <main className={styles.mainCanvas}>
        <div className={styles.pageMaxWidth}>
          
          {/* CONTROL DASHBOARD PANEL HEADER */}
          <header className={styles.pageHeader}>
            <div className={styles.headerLeftBlock}>
              <div>
                <h1>Global Control Settings Panel</h1>
                <p>Configure ecosystem routing paths, fallback canvas properties, and validation rules.</p>
              </div>
            </div>
          </header>

          {/* HORIZONTAL SUB-NAVIGATION ROW RAIL */}
          <nav className={styles.horizontalTopTabNavigationBarRail}>
            <button 
              type="button" 
              className={`${styles.horizontalTabLinkBtn} ${activeTab === "general" ? styles.tabActiveState : ""}`} 
              onClick={() => setActiveTab("general")}
            >
              <FiSliders size={14} />
              <span>General Configs</span>
            </button>
            <button 
              type="button" 
              className={`${styles.horizontalTabLinkBtn} ${activeTab === "templates" ? styles.tabActiveState : ""}`} 
              onClick={() => setActiveTab("templates")}
            >
              <FiFileText size={14} />
              <span>Template Geometry</span>
            </button>
            <button 
              type="button" 
              className={`${styles.horizontalTabLinkBtn} ${activeTab === "workflows" ? styles.tabActiveState : ""}`} 
              onClick={() => setActiveTab("workflows")}
            >
              <FiGitBranch size={14} />
              <span>Automation Workflows</span>
            </button>
            <button 
              type="button" 
              className={`${styles.horizontalTabLinkBtn} ${activeTab === "logs" ? styles.tabActiveState : ""}`} 
              onClick={() => setActiveTab("logs")}
            >
              <FiActivity size={14} />
              <span>System Logs</span>
            </button>
          </nav>

          {/* RENDER STAGE VIEWPORT CANVAS CONTAINER */}
          <section className={styles.rightContentWorkspaceWrapperViewport}>
            {renderActiveSubPage()}
          </section>

        </div>
      </main>
    </div>
  );
}

export default function GlobalSettingsOrchestrator() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        Loading...
      </div>
    }>
      <SettingsDashboardContent />
    </Suspense>
  );
}