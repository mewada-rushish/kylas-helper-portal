"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiArrowLeft } from "react-icons/fi";
import Sidebar from "@/components/layout/sidebar/sidebar";
import AdminButton from "@/components/ui/button/button";
import styles from "./templates.module.css";

const KYLAS_PRODUCTS = [
  { value: "prod_crm_ent", label: "Kylas CRM Premium Enterprise License" },
  { value: "prod_iot_node", label: "Smart Home IoT Sensor Node (AsmitA Hub)" },
  { value: "prod_bbps_gw", label: "BBPS Settlement Core Gateway API" },
  { value: "prod_devops_supp", label: "Dedicated Cloud DevOps Maintenance Hours" }
];

const INITIAL_TEMPLATES = [
  { 
    id: "tmpl_default", 
    name: "Standard PDF Layout Master", 
    isDefault: true, 
    attachedProductId: null,
    theme: { primaryColor: "#27347B", textColor: "#202223", backgroundColor: "#ffffff", borderColor: "#e1e3e5" }
  }
];

export default function TemplatesListingDashboard() {
  const router = useRouter();
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [previewTemplate, setPreviewTemplate] = useState(null);

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
                {templates.map((tmpl) => {
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
                            <button className={styles.iconActionBtn} onClick={() => setTemplates(templates.filter(t => t.id !== tmpl.id))} title="Delete Blueprint">
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                  <div className={styles.pdfInvoiceLayoutContainerMock} style={{ backgroundColor: previewTemplate.theme.backgroundColor, color: previewTemplate.theme.textColor, padding: "40px" }}>
                    <h2 style={{ color: previewTemplate.theme.primaryColor, fontFamily: "Montserrat", textAlign: "center" }}>TAX INVOICE RECONCILIATION</h2>
                    <p style={{ textAlign: "center", fontSize: "12px", color: "#6d7175" }}>[Active Blueprint Blueprint Layout Simulation Container Schema]</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}