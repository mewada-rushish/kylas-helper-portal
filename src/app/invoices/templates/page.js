"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiArrowLeft } from "react-icons/fi";
import Sidebar from "@/components/layout/sidebar/sidebar";
import AdminButton from "@/components/ui/button/button";
import SkeletonLoader from "@/components/ui/skeleton/skeleton";
import styles from "./templates.module.css";
import { resolveToken } from "@/lib/variable-resolver";

const KYLAS_PRODUCTS = [
  { value: "prod_crm_ent", label: "Kylas CRM Premium Enterprise License" },
  { value: "prod_iot_node", label: "Smart Home IoT Sensor Node (AsmitA Hub)" },
  { value: "prod_bbps_gw", label: "BBPS Settlement Core Gateway API" },
  { value: "prod_devops_supp", label: "Dedicated Cloud DevOps Maintenance Hours" }
];



export default function TemplatesListingDashboard() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [systemSettings, setSystemSettings] = useState(null);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/invoices/templates");
      if (res.ok) {
        const data = await res.json();
        // Parse theme if it's a string
        const parsedData = data.map(t => ({
          ...t,
          theme: typeof t.theme === "string" ? JSON.parse(t.theme) : t.theme
        }));
        setTemplates(parsedData);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetch("/api/settings")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && !data.error) setSystemSettings(data);
      })
      .catch(console.error);
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`/api/invoices/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  };

  return (
    <div className={styles.adminLayout}>
      <Sidebar activeId="invoices" />
      <main className={styles.mainCanvas}>
        <div className={styles.pageMaxWidth}>
          <header className={styles.pageHeader}>
            <div className={styles.headerLeftBlock}>
              <button className={styles.backButton} onClick={() => router.push("/invoices")} title="Back to Invoices">
                <FiArrowLeft />
              </button>
              <div className={styles.headerTitle}>
                <h1>Invoice PDF Layout Templates</h1>
                <p>Design multi-column templates or register precise product context layout overrides</p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <AdminButton variant="primary" icon={FiPlus} onClick={() => router.push(`/invoices/templates/${Date.now()}`)}>
                Create PDF Template
              </AdminButton>
            </div>
          </header>

          <div className={styles.tableCardFrame}>
            <table className={styles.invoiceTableGrid}>
              <thead>
                <tr>
                  <th>Layout Template Blueprint Name</th>
                  <th>Operational Scope Priority Mapping</th>
                  <th>System Rule Flag</th>
                  <th className={styles.textRight}>Available Options</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonLoader type="table" rows={3} columns={4} />
                ) : templates.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
                      No templates found. Create a new PDF template to get started.
                    </td>
                  </tr>
                ) : (
                  templates.map((tmpl) => {
                    const linkedProduct = KYLAS_PRODUCTS.find(p => p.value === tmpl.attachedProductId);
                    return (
                      <tr key={tmpl.id}>
                        <td className={styles.custPrimaryName}>{tmpl.name}</td>
                        <td className={styles.dateStampCell}>
                          {tmpl.isDefault ? "Global Core Fallback Configuration Layer" : `Exclusive Product Overwrite: ${linkedProduct?.label || "Alternative General"}`}
                        </td>
                        <td>
                          <span className={`${styles.statusLabelBadge} ${tmpl.isDefault ? styles.statusActive : styles.statusMapped}`}>
                            {tmpl.isDefault ? "Standard Default Blueprint" : "Dynamic Override Registered"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionsCellRow}>
                            <button className={styles.iconActionBtn} onClick={() => setPreviewTemplate(tmpl)} title="View Layout Blueprint">
                              <FiEye />
                            </button>
                            <button className={styles.iconActionBtn} onClick={() => router.push(`/invoices/templates/${tmpl.id}`)} title="Open Template Designer">
                              <FiEdit2 />
                            </button>
                            {!tmpl.isDefault && (
                              <button className={styles.iconActionBtn} onClick={() => handleDelete(tmpl.id)} title="Delete Blueprint">
                                <FiTrash2 />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {previewTemplate && (
            <div className={styles.modalViewportOverlay} onClick={() => setPreviewTemplate(null)}>
              <div className={`${styles.modalContentCardSheet} ${styles.modalContentCardSheetExpandedA4Viewport}`} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeaderTitleArea}>
                  <h3>Template Run Mock Simulation View</h3>
                  <button className={styles.modalCloseBtnCross} onClick={() => setPreviewTemplate(null)}>&times;</button>
                </div>
                <div className={styles.modalScrollablePDFPreviewCanvasBodyHousingContainer}>
                  <div 
                    className={styles.pdfInvoiceLayoutContainerMock}
                    dangerouslySetInnerHTML={{ __html: resolveToken(previewTemplate.config, {
                      invoice: { id: "INV-PREVIEW-001", total: 106200, tax: 18000 },
                      current: { date: new Date().toISOString().split("T")[0] },
                      customer: "Mock Client", 
                      email: "client@example.com",
                      product: { rate: 45000 },
                      amount: { words: "One Lakh Six Thousand Two Hundred" },
                      settings: systemSettings || {}
                    }) }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
