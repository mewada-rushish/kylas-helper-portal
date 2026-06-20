"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiLayout, FiEye, FiEdit2 } from "react-icons/fi";
import Sidebar from "@/components/layout/sidebar/sidebar";
import AdminButton from "@/components/ui/button/button";
import styles from "./invoices.module.css";

const KYLAS_PRODUCTS = [
  { value: "prod_crm_ent", label: "Kylas CRM Premium Enterprise License" },
  { value: "prod_iot_node", label: "Smart Home IoT Sensor Node (AsmitA Hub)" },
  { value: "prod_bbps_gw", label: "BBPS Settlement Core Gateway API" },
  { value: "prod_devops_supp", label: "Dedicated Cloud DevOps Maintenance Hours" }
];

const INITIAL_INVOICES = [
  { id: "INV-2026-001", customer: "Acme Corporate Entity", email: "finance@acme.com", date: "2026-06-18", productId: "prod_crm_ent", qty: 2, rate: 45000, total: 106200 },
  { id: "INV-2026-002", customer: "Society Hub Operations", email: "accounts@societyhub.in", date: "2026-06-19", productId: "prod_iot_node", qty: 10, rate: 3500, total: 100300 }
];

const FALLBACK_THEME = { primaryColor: "#27347B", textColor: "#202223", backgroundColor: "#ffffff", borderColor: "#e1e3e5" };

export default function InvoicesListPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [invoiceModalMode, setInvoiceModalOpen] = useState(null); 
  const [activeInvoice, setActiveInvoice] = useState(null);

  const [invCustomer, setInvCustomer] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invProduct, setInvProduct] = useState("prod_crm_ent");
  const [invQty, setInvQty] = useState(1);
  const [invRate, setInvRate] = useState(0);

  const handleOpenInvoiceModal = (mode, invoice = null) => {
    setInvoiceModalOpen(mode);
    if (invoice) {
      setActiveInvoice(invoice);
      setInvCustomer(invoice.customer);
      setInvEmail(invoice.email);
      setInvProduct(invoice.productId);
      setInvQty(invoice.qty);
      setInvRate(invoice.rate);
    } else {
      setActiveInvoice(null);
      setInvCustomer("");
      setInvEmail("");
      setInvProduct("prod_crm_ent");
      setInvQty(1);
      setInvRate(0);
    }
  };

  const handleSaveInvoice = (e) => {
    e.preventDefault();
    const qtyNum = Number(invQty);
    const rateNum = Number(invRate);
    const calculatedTotal = (qtyNum * rateNum) * 1.18; 

    if (invoiceModalMode === "create") {
      const newInv = {
        id: `INV-2026-00${invoices.length + 1}`,
        customer: invCustomer,
        email: invEmail,
        date: new Date().toISOString().split("T")[0],
        productId: invProduct,
        qty: qtyNum,
        rate: rateNum,
        total: calculatedTotal
      };
      setInvoices([newInv, ...invoices]);
    } else if (invoiceModalMode === "edit" && activeInvoice) {
      setInvoices(invoices.map(inv => inv.id === activeInvoice.id ? {
        ...inv,
        customer: invCustomer,
        email: invEmail,
        productId: invProduct,
        qty: qtyNum,
        rate: rateNum,
        total: calculatedTotal
      } : inv));
    }
    setInvoiceModalOpen(null);
  };

  return (
    <div className={styles.adminLayout}>
      <Sidebar activeId="invoices" />
      <main className={styles.mainCanvas}>
        <div className={styles.pageMaxWidth}>
          <header className={styles.pageHeader}>
            <div className={styles.headerTitle}>
              <h1>Generated Invoices</h1>
              <p>Track parameter-mapped operations billing ledger records synchronized downstream</p>
            </div>
            <div className={styles.headerActions}>
              <AdminButton variant="secondary" icon={FiLayout} onClick={() => router.push("/invoices/templates")}>
                Templates
              </AdminButton>
              <AdminButton variant="primary" icon={FiPlus} onClick={() => handleOpenInvoiceModal("create")}>
                Generate Invoice
              </AdminButton>
            </div>
          </header>

          <div className={styles.tableCardFrame}>
            <table className={styles.invoiceTableGrid}>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Target Client Account</th>
                  <th>Date Generated</th>
                  <th>Associated Product Scope</th>
                  <th>Gross Matrix Value</th>
                  <th className={styles.textRight}>Available Options</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className={styles.fontCodeIdentity}>{inv.id}</td>
                    <td>
                      <div className={styles.customerStackCell}>
                        <span className={styles.custPrimaryName}>{inv.customer}</span>
                        <span className={styles.custSubEmail}>{inv.email}</span>
                      </div>
                    </td>
                    <td className={styles.dateStampCell}>{inv.date}</td>
                    <td className={styles.productCell}>
                      {KYLAS_PRODUCTS.find(p => p.value === inv.productId)?.label || inv.productId}
                    </td>
                    <td className={styles.valueTotalBoldCell}>₹{inv.total.toLocaleString("en-IN")}</td>
                    <td>
                      <div className={styles.actionsCellRow}>
                        <button className={styles.iconActionBtn} onClick={() => handleOpenInvoiceModal("view", inv)} title="Preview Invoice parameters">
                          <FiEye />
                        </button>
                        <button className={styles.iconActionBtn} onClick={() => handleOpenInvoiceModal("edit", inv)} title="Update Baseline Parameters">
                          <FiEdit2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invoiceModalMode && (
            <div className={styles.modalViewportOverlay} onClick={() => setInvoiceModalOpen(null)}>
              <div className={`${styles.modalContentCardSheet} ${invoiceModalMode === "view" ? styles.modalContentCardSheetExpandedA4Viewport : ""}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeaderTitleArea}>
                  <h3>
                    {invoiceModalMode === "create" && "Generate Invoice"}
                    {invoiceModalMode === "edit" && `Update Invoice Parameters: ${activeInvoice?.id}`}
                    {invoiceModalMode === "view" && `Invoice Document Preview: ${activeInvoice?.id}`}
                  </h3>
                  <button className={styles.modalCloseBtnCross} onClick={() => setInvoiceModalOpen(null)}>&times;</button>
                </div>

                {invoiceModalMode === "view" && activeInvoice ? (
                  <div className={styles.modalScrollablePDFPreviewCanvasBodyHousingContainer}>
                    <div className={styles.pdfInvoiceLayoutContainerMock} style={{ backgroundColor: FALLBACK_THEME.backgroundColor, color: FALLBACK_THEME.textColor, padding: "40px" }}>
                      <h2 style={{ color: FALLBACK_THEME.primaryColor, fontFamily: "Montserrat, sans-serif", textAlign: "center", marginBottom: "20px" }}>TAX INVOICE</h2>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontFamily: "Poppins, sans-serif", fontSize: "13px" }}>
                        <div><strong>Billed To:</strong><br/>{activeInvoice.customer}<br/>{activeInvoice.email}</div>
                        <div style={{ textAlign: "right" }}><strong>Invoice ID:</strong> {activeInvoice.id}<br/><strong>Date:</strong> {activeInvoice.date}</div>
                      </div>
                      <table width="100%" style={{ borderCollapse: "collapse", fontSize: "12px", fontFamily: "Poppins, sans-serif" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e1e3e5" }}>
                            <th align="left" style={{ padding: "10px" }}>Item Description</th>
                            <th align="center" style={{ padding: "10px" }}>Qty</th>
                            <th align="right" style={{ padding: "10px" }}>Rate</th>
                            <th align="right" style={{ padding: "10px" }}>Gross Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: "1px solid #e1e3e5" }}>
                            <td style={{ padding: "10px" }}>{KYLAS_PRODUCTS.find(p => p.value === activeInvoice.productId)?.label}</td>
                            <td align="center" style={{ padding: "10px" }}>{activeInvoice.qty}</td>
                            <td align="right" style={{ padding: "10px" }}>₹{activeInvoice.rate.toLocaleString("en-IN")}.00</td>
                            <td align="right" style={{ padding: "10px", fontWeight: "600" }}>₹{activeInvoice.total.toLocaleString("en-IN")}.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveInvoice} className={styles.invoiceInteractiveFormStack}>
                    <div className={styles.formRowTwoColumnGrid}>
                      <div className={styles.inputFieldGroupBlock}>
                        <label>Client Name</label>
                        <input type="text" placeholder="Enter target organization name..." value={invCustomer} onChange={(e) => setInvCustomer(e.target.value)} required />
                      </div>
                      <div className={styles.inputFieldGroupBlock}>
                        <label>Client Email</label>
                        <input type="email" placeholder="billing@entity.com" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} required />
                      </div>
                    </div>
                    <div className={styles.inputFieldGroupBlock}>
                      <label>Kylas Sync Catalog Product Mapping</label>
                      <select className={styles.builderSelectField} value={invProduct} onChange={(e) => setInvProduct(e.target.value)}>
                        {KYLAS_PRODUCTS.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formRowTwoColumnGrid}>
                      <div className={styles.inputFieldGroupBlock}>
                        <label>Quantity</label>
                        <input type="number" min="1" placeholder="1" value={invQty} onChange={(e) => setInvQty(e.target.value)} required />
                      </div>
                      <div className={styles.inputFieldGroupBlock}>
                        <label>Unit Purchase Rate (₹)</label>
                        <input type="number" min="0" placeholder="0" value={invRate} onChange={(e) => setInvRate(e.target.value)} required />
                      </div>
                    </div>
                    <div className={styles.modalFooterActionsBlockRow}>
                      <AdminButton variant="secondary" onClick={() => setInvoiceModalOpen(null)}>Cancel</AdminButton>
                      <AdminButton variant="primary" type="submit">Save Invoice Changes</AdminButton>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}