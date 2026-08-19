"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import React, { Suspense } from "react";
import { FiCheck, FiSliders, FiFileText, FiGitBranch, FiActivity } from "react-icons/fi";
import Sidebar from "@/components/layout/sidebar/sidebar";
import AdminButton from "@/components/ui/button/button";
import toast from "react-hot-toast";
import styles from "./settings.module.css";

// Decoupled Sub-Page Feature Component Folders
import GeneralSettings from "./components/GeneralSettings/GeneralSettings";
import TemplateGeometry from "./components/TemplateGeometry/TemplateGeometry";
import IncomingWebhooks from "./components/IncomingWebhooks/IncomingWebhooks";
import WorkflowSettings from "./components/WorkflowSettings/WorkflowSettings";
import SystemLogs from "./components/SystemLogs/SystemLogs";

function SettingsDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const activeTab = searchParams.get("tab") || "general";

  // Deterministic UI view renderer switcher map
  const renderActiveSubPage = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "templates":
        return <TemplateGeometry />;
      case "incoming-webhooks":
        return <IncomingWebhooks />;
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
            <Link 
              href={`${pathname}?tab=general`}
              replace
              scroll={false}
              className={`${styles.horizontalTabLinkBtn} ${activeTab === "general" ? styles.tabActiveState : ""}`} 
            >
              <FiSliders size={14} />
              <span>General Configs</span>
            </Link>
            <Link 
              href={`${pathname}?tab=templates`}
              replace
              scroll={false}
              className={`${styles.horizontalTabLinkBtn} ${activeTab === "templates" ? styles.tabActiveState : ""}`} 
            >
              <FiFileText size={14} />
              <span>Template Geometry</span>
            </Link>
            <Link 
              href={`${pathname}?tab=incoming-webhooks`}
              replace
              scroll={false}
              className={`${styles.horizontalTabLinkBtn} ${activeTab === "incoming-webhooks" ? styles.tabActiveState : ""}`} 
            >
              <FiGitBranch size={14} />
              <span>Incoming Webhooks</span>
            </Link>
            <Link 
              href={`${pathname}?tab=workflows`}
              replace
              scroll={false}
              className={`${styles.horizontalTabLinkBtn} ${activeTab === "workflows" ? styles.tabActiveState : ""}`} 
            >
              <FiGitBranch size={14} />
              <span>Automation Workflows</span>
            </Link>
            <Link 
              href={`${pathname}?tab=logs`}
              replace
              scroll={false}
              className={`${styles.horizontalTabLinkBtn} ${activeTab === "logs" ? styles.tabActiveState : ""}`} 
            >
              <FiActivity size={14} />
              <span>System Logs</span>
            </Link>
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
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", gap: "16px" }}>
        <div className="page-loader-spinner" />
        <span className="page-loader-text">Loading settings...</span>
      </div>
    }>
      <SettingsDashboardContent />
    </Suspense>
  );
}