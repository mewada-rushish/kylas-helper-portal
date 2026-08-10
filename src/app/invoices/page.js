"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiLayout, FiEye, FiEdit2, FiX, FiPrinter, FiDownload } from "react-icons/fi";
import Sidebar from "@/components/layout/sidebar/sidebar";
import AdminButton from "@/components/ui/button/button";
import CustomDropdown from "@/components/ui/dropdown/dropdown";
import SkeletonLoader from "@/components/ui/skeleton/skeleton";
import styles from "./invoices.module.css";
import { resolveToken } from "@/lib/variable-resolver";

const KYLAS_PRODUCTS = [
  { value: "prod_crm_ent", label: "Kylas CRM Premium Enterprise License" },
  { value: "prod_iot_node", label: "Smart Home IoT Sensor Node (AsmitA Hub)" },
  { value: "prod_bbps_gw", label: "BBPS Settlement Core Gateway API" },
  { value: "prod_devops_supp", label: "Dedicated Cloud DevOps Maintenance Hours" }
];const INITIAL_INVOICES = [
  { id: "INV-2026-001", customer: "Acme Corporate Entity", email: "finance@acme.com", date: "2026-06-18", productId: "prod_crm_ent", qty: 2, rate: 45000, total: 106200, memberId: "SCC-0123", amount: { words: "one lakh six thousand two hundred" }, payment: { periodStart: "01/01/2026", periodEnd: "31/12/2026", method: "Cheque", referenceNo: "123456", bankName: "HDFC Bank", date: "15/06/2026" } },
  { id: "INV-2026-002", customer: "Society Hub Operations", email: "accounts@societyhub.in", date: "2026-06-19", productId: "prod_iot_node", qty: 10, rate: 3500, total: 100300, memberId: "SCC-0124", amount: { words: "one lakh three hundred" }, payment: { periodStart: "01/01/2026", periodEnd: "31/12/2026", method: "NEFT/IMPS", referenceNo: "N/A", bankName: "SBI Bank", date: "18/06/2026" } }
];

const FALLBACK_THEME = { primaryColor: "#27347B", textColor: "#202223", backgroundColor: "#ffffff", borderColor: "#e1e3e5" };

export default function InvoicesListPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invoiceModalMode, setInvoiceModalOpen] = useState(null); 
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [defaultTemplate, setDefaultTemplate] = useState(null);
  const [systemSettings, setSystemSettings] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInvoices(INITIAL_INVOICES);
      setIsLoading(false);
    }, 1200);
    
    // Fetch default template
    fetch("/api/invoices/templates")
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const def = data.find(t => t.isDefault);
        if (def) setDefaultTemplate(def);
      })
      .catch(console.error);

    // Fetch system settings
    fetch("/api/settings")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && !data.error) setSystemSettings(data);
      })
      .catch(console.error);
      
    return () => clearTimeout(timer);
  }, []);

  const [invCustomer, setInvCustomer] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invMemberId, setInvMemberId] = useState("");
  const [invAmountWords, setInvAmountWords] = useState("");
  const [invProduct, setInvProduct] = useState("prod_crm_ent");
  const [invQty, setInvQty] = useState(1);
  const [invRate, setInvRate] = useState(0);
  const [invPeriodStart, setInvPeriodStart] = useState("");
  const [invPeriodEnd, setInvPeriodEnd] = useState("");
  const [invPaymentMethod, setInvPaymentMethod] = useState("Cash");
  const [invReferenceNo, setInvReferenceNo] = useState("");
  const [invBankName, setInvBankName] = useState("");
  const [invPaymentDate, setInvPaymentDate] = useState("");

  const handleOpenInvoiceModal = (mode, invoice = null) => {
    setInvoiceModalOpen(mode);
    if (invoice) {
      setActiveInvoice(invoice);
      setInvCustomer(invoice.customer || "");
      setInvEmail(invoice.email || "");
      setInvMemberId(invoice.memberId || "");
      setInvAmountWords(invoice.amount?.words || "");
      setInvProduct(invoice.productId || "prod_crm_ent");
      setInvQty(invoice.qty || 1);
      setInvRate(invoice.rate || 0);
      setInvPeriodStart(invoice.payment?.periodStart || "");
      setInvPeriodEnd(invoice.payment?.periodEnd || "");
      setInvPaymentMethod(invoice.payment?.method || "Cash");
      setInvReferenceNo(invoice.payment?.referenceNo || invoice.payment?.chequeNo || "");
      setInvBankName(invoice.payment?.bankName || "");
      setInvPaymentDate(invoice.payment?.date || "");
    } else {
      setActiveInvoice(null);
      setInvCustomer("");
      setInvEmail("");
      setInvMemberId("");
      setInvAmountWords("");
      setInvProduct("prod_crm_ent");
      setInvQty(1);
      setInvRate(0);
      setInvPeriodStart("");
      setInvPeriodEnd("");
      setInvPaymentMethod("Cash");
      setInvReferenceNo("");
      setInvBankName("");
      setInvPaymentDate(new Date().toISOString().split("T")[0]);
    }
  };

  const handleSaveInvoice = (e) => {
    e.preventDefault();
    const qtyNum = Number(invQty);
    const rateNum = Number(invRate);
    const calculatedTotal = (qtyNum * rateNum) * 1.18; 

    const invoiceData = {
      customer: invCustomer,
      email: invEmail,
      memberId: invMemberId,
      productId: invProduct,
      qty: qtyNum,
      rate: rateNum,
      total: calculatedTotal,
      amount: { words: invAmountWords },
      payment: {
        periodStart: invPeriodStart,
        periodEnd: invPeriodEnd,
        method: invPaymentMethod,
        referenceNo: invReferenceNo,
        bankName: invBankName,
        date: invPaymentDate
      }
    };

    if (invoiceModalMode === "create") {
      const newInv = {
        id: `INV-2026-00${invoices.length + 1}`,
        date: new Date().toISOString().split("T")[0],
        ...invoiceData
      };
      setInvoices([newInv, ...invoices]);
    } else if (invoiceModalMode === "edit" && activeInvoice) {
      setInvoices(invoices.map(inv => inv.id === activeInvoice.id ? {
        ...inv,
        ...invoiceData
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
                {isLoading ? (
                  <SkeletonLoader type="table" rows={4} columns={6} />
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
                      No invoices found. Generate a new invoice to get started.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
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
                  ))
                )}
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
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                    <div className={styles.modalScrollablePDFPreviewCanvasBodyHousingContainer}>
                      {defaultTemplate ? (
                        <div 
                          id="invoice-preview-container"
                          className={styles.pdfInvoiceLayoutContainerMock}
                          dangerouslySetInnerHTML={{ __html: resolveToken(defaultTemplate.config, { ...activeInvoice, settings: systemSettings || {} }) }}
                        />
                      ) : (
                        <div id="invoice-preview-container" className={styles.pdfInvoiceLayoutContainerMock} style={{ backgroundColor: FALLBACK_THEME.backgroundColor, color: FALLBACK_THEME.textColor, padding: "40px" }}>
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
                      )}
                    </div>
                    <div style={{ padding: "16px 24px", backgroundColor: "#fff", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                      <AdminButton variant="secondary" onClick={() => setInvoiceModalOpen(null)}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><FiX /> <span>Close</span></div>
                      </AdminButton>
                      <AdminButton variant="secondary" onClick={() => {
                        const el = document.getElementById("invoice-preview-container");
                        if (el) {
                          const w = window.open('', '_blank');
                          w.document.write('<html><head><title>Print</title></head><body style="margin:0;">' + el.outerHTML + '</body></html>');
                          w.document.close();
                          w.onload = () => { w.print(); };
                        }
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><FiPrinter /> <span>Print</span></div>
                      </AdminButton>
                      <AdminButton variant="primary" onClick={async () => {
                        const el = document.getElementById("invoice-preview-container");
                        if (el) {
                          const html2pdf = (await import("html2pdf.js")).default;
                          html2pdf().from(el).set({ margin: 0, filename: `${activeInvoice.id}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } }).save();
                        }
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><FiDownload /> <span>Download PDF</span></div>
                      </AdminButton>
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
                    <div className={styles.formRowTwoColumnGrid}>
                      <div className={styles.inputFieldGroupBlock}>
                        <label>Member ID</label>
                        <input type="text" placeholder="e.g. SCC - 1" value={invMemberId} onChange={(e) => setInvMemberId(e.target.value)} />
                      </div>
                      <div className={styles.inputFieldGroupBlock}>
                        <label>Amount In Words</label>
                        <input type="text" placeholder="e.g. One Lakh Only" value={invAmountWords} onChange={(e) => setInvAmountWords(e.target.value)} />
                      </div>
                    </div>
                    <div className={styles.inputFieldGroupBlock}>
                      <label>Kylas Sync Catalog Product Mapping</label>
                      <CustomDropdown 
                        options={KYLAS_PRODUCTS} 
                        selectedValue={invProduct} 
                        onSelect={setInvProduct} 
                      />
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
                    <div className={styles.formRowTwoColumnGrid}>
                      <div className={styles.inputFieldGroupBlock}>
                        <label>Period Start Date</label>
                        <input type="date" value={invPeriodStart} onChange={(e) => setInvPeriodStart(e.target.value)} />
                      </div>
                      <div className={styles.inputFieldGroupBlock}>
                        <label>Period End Date</label>
                        <input type="date" value={invPeriodEnd} onChange={(e) => setInvPeriodEnd(e.target.value)} />
                      </div>
                    </div>
                    <div className={styles.formRowTwoColumnGrid}>
                      <div className={styles.inputFieldGroupBlock}>
                        <label>Payment Method</label>
                        <select value={invPaymentMethod} onChange={(e) => setInvPaymentMethod(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", background: "#f8fafc" }}>
                          <option value="Cheque">Cheque</option>
                          <option value="UPI">UPI</option>
                          <option value="NEFT/IMPS">NEFT / IMPS</option>
                          <option value="Cash">Cash</option>
                        </select>
                      </div>
                      
                      {invPaymentMethod !== "Cash" && (
                        <div className={styles.inputFieldGroupBlock}>
                          <label>
                            {invPaymentMethod === "Cheque" ? "Cheque No" : invPaymentMethod === "UPI" ? "Transaction ID" : "UTR No"}
                          </label>
                          <input type="text" placeholder={`Enter ${invPaymentMethod === "Cheque" ? "Cheque No" : "Ref No"}`} value={invReferenceNo} onChange={(e) => setInvReferenceNo(e.target.value)} />
                        </div>
                      )}
                    </div>

                    <div className={styles.formRowTwoColumnGrid}>
                      {(invPaymentMethod === "Cheque" || invPaymentMethod === "NEFT/IMPS") && (
                        <div className={styles.inputFieldGroupBlock}>
                          <label>Bank Name</label>
                          <input type="text" placeholder="e.g. HDFC Bank" value={invBankName} onChange={(e) => setInvBankName(e.target.value)} />
                        </div>
                      )}
                      
                      <div className={styles.inputFieldGroupBlock} style={{ gridColumn: (invPaymentMethod === "Cheque" || invPaymentMethod === "NEFT/IMPS") ? "auto" : "1 / -1" }}>
                        <label>Payment Date</label>
                        <input type="date" value={invPaymentDate} onChange={(e) => setInvPaymentDate(e.target.value)} />
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