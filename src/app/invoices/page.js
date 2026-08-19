"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiLayout, FiEye, FiEdit2, FiX, FiPrinter, FiDownload, FiFileText, FiLoader, FiChevronLeft, FiChevronRight, FiTrash2, FiSearch, FiFilter, FiBox, FiRefreshCw, FiMoreVertical } from "react-icons/fi";
import { toast } from "react-hot-toast";
import Sidebar from "@/components/layout/sidebar/sidebar";
import AdminButton from "@/components/ui/button/button";
import CustomDropdown from "@/components/ui/dropdown/dropdown";
import SkeletonLoader from "@/components/ui/skeleton/skeleton";
import CentralizedModal from "@/components/ui/modal/modal";
import styles from "./invoices.module.css";
import { resolveToken, generateProductAcronym } from "@/lib/variable-resolver";
import { useSession } from "next-auth/react";

const KYLAS_PRODUCTS = [
  { value: "prod_crm_ent", label: "Kylas CRM Premium Enterprise License" },
  { value: "prod_iot_node", label: "Smart Home IoT Sensor Node (AsmitA Hub)" },
  { value: "prod_bbps_gw", label: "BBPS Settlement Core Gateway API" },
  { value: "prod_devops_supp", label: "Dedicated Cloud DevOps Maintenance Hours" }
];

const FALLBACK_THEME = { primaryColor: "#27347B", textColor: "#202223", backgroundColor: "#ffffff", borderColor: "#e1e3e5" };

export default function InvoicesListPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [invoiceModalMode, setInvoiceModalOpen] = useState(null); 
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [defaultTemplate, setDefaultTemplate] = useState(null);
  const [systemSettings, setSystemSettings] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      !searchQuery || 
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (inv.customer && inv.customer.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.email && inv.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.total && inv.total.toString().includes(searchQuery.toLowerCase()));
      
    const matchesProduct = filterProduct === "all" || inv.productId === filterProduct;
    
    let matchesDate = true;
    if (filterStartDate || filterEndDate) {
      const invDate = new Date(inv.date);
      if (filterStartDate && new Date(filterStartDate) > invDate) matchesDate = false;
      
      // End date check (set end date time to end of day for inclusive comparison if it's just a date string)
      if (filterEndDate) {
        const endDateObj = new Date(filterEndDate);
        endDateObj.setHours(23, 59, 59, 999);
        if (endDateObj < invDate) matchesDate = false;
      }
    }
    
    return matchesSearch && matchesProduct && matchesDate;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterProduct, filterStartDate, filterEndDate]);

  const fetchInvoices = () => {
    setIsLoading(true);
    fetch("/api/invoices")
      .then(res => res.json())
      .then(data => {
        setInvoices(data);
        setIsLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchInvoices();
    
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
      
  }, []);

  const formatWithSetting = (dateStr) => {
    if (!dateStr) return "";
    let dStr = dateStr;
    if (dStr.includes('T')) dStr = dStr.split('T')[0];
    const parts = dStr.split('-');
    if (parts.length === 3) {
      if (systemSettings?.dateFormat === "DD/MM/YYYY") return `${parts[2]}/${parts[1]}/${parts[0]}`;
      if (systemSettings?.dateFormat === "DD-MM-YYYY") return `${parts[2]}-${parts[1]}-${parts[0]}`;
      if (systemSettings?.dateFormat === "MM/DD/YYYY") return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return dStr;
  };


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
      setInvAmountWords(invoice.amount?.words || "");
      setInvProduct(invoice.productId || "prod_crm_ent");
      
      const acronym = generateProductAcronym(KYLAS_PRODUCTS.find(p => p.value === (invoice.productId || "prod_crm_ent"))?.label);
      let rawId = invoice.memberId || "";
      if (acronym && rawId.startsWith(`${acronym}-`)) {
        rawId = rawId.substring(acronym.length + 1);
      } else if (acronym && rawId === acronym) {
        rawId = "";
      }
      setInvMemberId(rawId);
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

  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const qtyNum = Number(invQty);
    const rateNum = Number(invRate);
    const calculatedTotal = (qtyNum * rateNum) * 1.18; 

    const acronym = generateProductAcronym(KYLAS_PRODUCTS.find(p => p.value === invProduct)?.label);
    let finalMemberId = invMemberId || "";
    if (acronym && finalMemberId && !finalMemberId.startsWith(acronym)) {
      finalMemberId = `${acronym}-${finalMemberId}`;
    } else if (acronym && !finalMemberId) {
      finalMemberId = acronym;
    }

    const invoiceData = {
      customer: invCustomer,
      email: invEmail,
      memberId: finalMemberId,
      productId: invProduct,
      qty: qtyNum,
      rate: rateNum,
      total: calculatedTotal,
      amount: { words: invAmountWords },
      payment: {
        periodStart: invPeriodStart,
        periodEnd: invPeriodEnd,
        method: invPaymentMethod,
        referenceNo: invPaymentMethod === "Cash" ? "" : invReferenceNo,
        bankName: (invPaymentMethod === "Cash" || invPaymentMethod === "UPI") ? "" : invBankName,
        date: invPaymentDate
      }
    };

    try {
      if (invoiceModalMode === "create") {
        const payload = {
          date: new Date().toISOString().split("T")[0],
          ...invoiceData
        };
        await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else if (invoiceModalMode === "edit" && activeInvoice) {
        const payload = {
          date: activeInvoice.date,
          ...invoiceData
        };
        await fetch(`/api/invoices/${activeInvoice.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      fetchInvoices();
      setInvoiceModalOpen(null);
    } catch (error) {
      console.error("Failed to save invoice:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInvoice = (invoiceId) => {
    setInvoiceToDelete(invoiceId);
  };

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/invoices/${invoiceToDelete}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Invoice deleted successfully");
        fetchInvoices();
      } else {
        toast.error("Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("An error occurred while deleting the invoice");
    } finally {
      setIsDeleting(false);
      setInvoiceToDelete(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectInvoice = (id) => {
    setSelectedInvoices(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const newIds = paginatedInvoices.map(inv => inv.id).filter(id => !selectedInvoices.includes(id));
      setSelectedInvoices(prev => [...prev, ...newIds]);
    } else {
      const paginatedIds = paginatedInvoices.map(inv => inv.id);
      setSelectedInvoices(prev => prev.filter(id => !paginatedIds.includes(id)));
    }
  };
  
  const allCurrentPageSelected = paginatedInvoices.length > 0 && paginatedInvoices.every(inv => selectedInvoices.includes(inv.id));

  const confirmBulkDelete = async () => {
    if (selectedInvoices.length === 0) return;
    setIsBulkDeleting(true);
    
    try {
      const res = await fetch(`/api/invoices/bulk`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedInvoices })
      });
      if (res.ok) {
        toast.success(`${selectedInvoices.length} invoices deleted successfully`);
        setSelectedInvoices([]);
        setShowBulkDeleteModal(false);
        fetchInvoices();
      } else {
        toast.error("Failed to delete invoices");
      }
    } catch (error) {
      console.error("Error bulk deleting invoices:", error);
      toast.error("An error occurred during bulk deletion");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkExportCSV = () => {
    if (selectedInvoices.length === 0) return;
    
    const selectedData = invoices.filter(inv => selectedInvoices.includes(inv.id));
    
    const headers = ["Invoice ID", "Customer Name", "Email", "Date", "Product", "Total Amount", "PDF Link"];
    const rows = selectedData.map(inv => [
      inv.id,
      `"${inv.customer || ""}"`,
      `"${inv.email || ""}"`,
      formatWithSetting(inv.date),
      `"${KYLAS_PRODUCTS.find(p => p.value === inv.productId)?.label || inv.productId || ""}"`,
      inv.total,
      `"${inv.publicUrl || ""}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Invoices_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${selectedData.length} invoices exported to CSV`);
  };

  const handleBulkDownloadPDFs = () => {
    if (selectedInvoices.length === 0) return;
    const selectedData = invoices.filter(inv => selectedInvoices.includes(inv.id));
    
    let downloadCount = 0;
    selectedData.forEach((inv, index) => {
      if (inv.publicUrl) {
        downloadCount++;
        setTimeout(() => {
          const link = document.createElement("a");
          link.href = inv.publicUrl;
          link.target = "_blank";
          link.download = `Invoice_${inv.id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, index * 300);
      }
    });
    
    if (downloadCount > 0) {
      toast.success(`Downloading ${downloadCount} invoice PDFs...`);
    } else {
      toast.error("No PDFs available to download for selected invoices");
    }
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
              {selectedInvoices.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginRight: '16px', paddingRight: '16px', borderRight: '1px solid #e2e8f0' }}>
                  <AdminButton variant="secondary" onClick={handleBulkDownloadPDFs}>
                    <FiFileText style={{ color: '#3b82f6' }} /> Download PDFs
                  </AdminButton>
                  <AdminButton variant="secondary" onClick={handleBulkExportCSV}>
                    <FiDownload style={{ color: '#10b981' }} /> Export CSV
                  </AdminButton>
                  {(session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "DEVELOPER") && (
                    <AdminButton variant="secondary" onClick={() => setShowBulkDeleteModal(true)}>
                      <FiTrash2 style={{ color: '#ef4444' }} /> Delete ({selectedInvoices.length})
                    </AdminButton>
                  )}
                </div>
              )}
              <AdminButton variant="secondary" icon={FiLayout} onClick={() => router.push("/invoices/templates")}>
                Templates
              </AdminButton>
              <AdminButton variant="primary" icon={FiPlus} onClick={() => handleOpenInvoiceModal("create")}>
                Generate Invoice
              </AdminButton>
            </div>
          </header>

          <div className={styles.tableCardFrame}>
            <div style={{ display: 'flex', gap: '12px', padding: '16px 20px', borderBottom: '1px solid #e1e3e5', backgroundColor: '#f8f9fa', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', alignItems: 'center' }}>
              
              <div style={{ flex: 1, maxWidth: '350px', position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8c9196', width: '16px', height: '16px' }} />
                <input 
                  type="text" 
                  placeholder="Search by ID, Client Name, Email, or Amount..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', color: '#334155', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', background: '#fff' }}
                />
              </div>

              <div style={{ width: '220px' }}>
                <CustomDropdown 
                  icon={FiBox}
                  placeholder="All Products"
                  options={[
                    { value: "all", label: "All Products" },
                    ...KYLAS_PRODUCTS
                  ]} 
                  selectedValue={filterProduct} 
                  onSelect={(val) => setFilterProduct(val)}
                  triggerClassName={styles.filterDropdownOverride}
                />
              </div>

              <div style={{ flex: 1 }}></div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  style={{ width: '125px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '12px', color: '#334155', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', background: '#fff' }}
                  title="Start Date"
                />
                <span style={{ color: '#8c9196', fontSize: '12px' }}>to</span>
                <input 
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  style={{ width: '125px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '12px', color: '#334155', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', background: '#fff' }}
                  title="End Date"
                />
              </div>

              <button 
                onClick={fetchInvoices}
                title="Refresh Invoices"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  cursor: 'pointer',
                  color: '#64748b',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <FiRefreshCw style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <div style={{ minHeight: '260px' }}>
              <table className={styles.invoiceTableGrid}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={allCurrentPageSelected}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th>Invoice ID</th>
                  <th>Target Client Account</th>
                  <th>Date Generated</th>
                  <th>Associated Product Scope</th>
                  <th>Gross Matrix Value</th>
                  <th className={styles.textRight}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonLoader type="table" rows={4} columns={7} />
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((inv) => (
                      <tr key={inv.id} style={{ backgroundColor: selectedInvoices.includes(inv.id) ? '#f8fafc' : 'transparent' }}>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedInvoices.includes(inv.id)}
                            onChange={() => handleSelectInvoice(inv.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td className={styles.fontCodeIdentity}>{inv.id}</td>
                        <td>
                          <div className={styles.customerStackCell}>
                            <span className={styles.custPrimaryName}>{inv.customer}</span>
                            <span className={styles.custSubEmail}>{inv.email}</span>
                          </div>
                        </td>
                        <td className={styles.dateStampCell}>{formatWithSetting(inv.date)}</td>
                        <td className={styles.productCell}>
                          {KYLAS_PRODUCTS.find(p => p.value === inv.productId)?.label || inv.productId}
                        </td>
                        <td className={styles.valueTotalBoldCell}>₹{inv.total.toLocaleString("en-IN")}</td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div className={styles.actionMenuWrapper}>
                              <button 
                                className={`${styles.iconBtn} ${openMenuId === inv.id ? styles.iconBtnActive : ""}`} 
                                title="More Options"
                                onClick={() => setOpenMenuId(openMenuId === inv.id ? null : inv.id)}
                              >
                                <FiMoreVertical />
                              </button>
                              
                              {openMenuId === inv.id && (
                                <div className={styles.actionDropdown}>
                                  <button onClick={() => handleOpenInvoiceModal("edit", inv)}>
                                    <FiEdit2 /> Edit Invoice
                                  </button>
                                  <button onClick={() => handleOpenInvoiceModal("view", inv)}>
                                    <FiEye /> View Invoice
                                  </button>
                                  {inv.pdfUrl && (
                                    <a href={`/api/download?url=${encodeURIComponent(inv.pdfUrl)}&filename=${encodeURIComponent(inv.id + '.pdf')}`} className={styles.dropdownLinkBtn} title="Download Invoice">
                                      <FiDownload /> Download Invoice
                                    </a>
                                  )}
                                  {(session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "DEVELOPER") && (
                                    <button className={styles.dangerText} onClick={() => handleDeleteInvoice(inv.id)}>
                                      <FiTrash2 /> Delete Invoice
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
            </div>

            {/* Pagination Controls */}
            {(() => {
              const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));
              return (
                <div className={styles.paginationWrapper}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={styles.pageInfo}>
                      Showing {filteredInvoices.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} entries
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#8c9196', fontFamily: 'var(--font-poppins), sans-serif' }}>Show:</span>
                      <CustomDropdown 
                        options={[
                          { value: 5, label: "5" },
                          { value: 10, label: "10" },
                          { value: 20, label: "20" },
                          { value: 50, label: "50" },
                          { value: 100, label: "100" }
                        ]} 
                        selectedValue={itemsPerPage} 
                        onSelect={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}
                        triggerClassName={styles.pageSizeDropdownTrigger}
                      />
                    </div>
                  </div>
                  <div className={styles.paginationControls}>
                    <button 
                      disabled={currentPage === 1} 
                      onClick={() => setCurrentPage(p => p - 1)} 
                      className={styles.pageBtn}
                      title="Previous Page"
                    >
                      <FiChevronLeft className={styles.pageIcon} />
                    </button>
                    <div className={styles.pageTracker}>Page {currentPage} of {totalPages}</div>
                    <button 
                      disabled={currentPage === totalPages} 
                      onClick={() => setCurrentPage(p => p + 1)} 
                      className={styles.pageBtn}
                      title="Next Page"
                    >
                      <FiChevronRight className={styles.pageIcon} />
                    </button>
                  </div>
                </div>
              );
            })()}
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
                          dangerouslySetInnerHTML={{ 
                      __html: resolveToken(defaultTemplate.config, { 
                        ...activeInvoice,
                        customer: { name: activeInvoice.customer, email: activeInvoice.email },
                        current: { date: formatWithSetting(activeInvoice.date) },
                        payment: {
                          periodStart: formatWithSetting(activeInvoice.payment?.periodStart || activeInvoice.periodStart),
                          periodEnd: formatWithSetting(activeInvoice.payment?.periodEnd || activeInvoice.periodEnd),
                          date: formatWithSetting(activeInvoice.payment?.date || activeInvoice.paymentDate),
                          method: activeInvoice.payment?.method || activeInvoice.paymentMethod || "",
                          bankName: activeInvoice.payment?.bankName || activeInvoice.paymentBankName || "",
                          referenceNo: activeInvoice.payment?.referenceNo || activeInvoice.paymentReferenceNo || ""
                        },
                        invoice: { id: activeInvoice.id, total: `₹${Number(activeInvoice.total).toLocaleString("en-IN")}` },
                        product: { name: KYLAS_PRODUCTS[activeInvoice.productId] || activeInvoice.productId },
                        amount: { words: activeInvoice.amountWords || "" },
                        settings: systemSettings || {} 
                      }) 
                    }}
                        />
                      ) : (
                        <div id="invoice-preview-container" className={styles.pdfInvoiceLayoutContainerMock} style={{ backgroundColor: FALLBACK_THEME.backgroundColor, color: FALLBACK_THEME.textColor, padding: "40px" }}>
                          <h2 style={{ color: FALLBACK_THEME.primaryColor, fontFamily: "Montserrat, sans-serif", textAlign: "center", marginBottom: "20px" }}>TAX INVOICE</h2>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontFamily: "Poppins, sans-serif", fontSize: "13px" }}>
                            <div><strong>Billed To:</strong><br/>{activeInvoice.customer}<br/>{activeInvoice.email}</div>
                            <div style={{ textAlign: "right" }}><strong>Invoice ID:</strong> {activeInvoice.id}<br/><strong>Date:</strong> {formatWithSetting(activeInvoice.date)}</div>
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
                        <div style={{ display: "flex", alignItems: "stretch", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                          <span style={{ 
                            display: "flex", alignItems: "center", padding: "0 12px", 
                            background: "#f1f5f9", color: "#475569", fontSize: "13px", 
                            fontWeight: 500, borderRight: "1px solid #e2e8f0" 
                          }}>
                            {generateProductAcronym(KYLAS_PRODUCTS.find(p => p.value === invProduct)?.label) ? `${generateProductAcronym(KYLAS_PRODUCTS.find(p => p.value === invProduct)?.label)}-` : ""}
                          </span>
                          <input 
                            type="text" 
                            placeholder="e.g. 1" 
                            value={invMemberId} 
                            onChange={(e) => setInvMemberId(e.target.value)} 
                            style={{ border: "none", borderRadius: 0, flex: 1, margin: 0, boxShadow: "none" }} 
                          />
                        </div>
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
                      <AdminButton variant="primary" type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <FiLoader className={styles.spinner} /> Saving...
                          </span>
                        ) : "Save Invoice Changes"}
                      </AdminButton>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          <CentralizedModal
            isOpen={!!invoiceToDelete}
            onClose={() => !isDeleting && setInvoiceToDelete(null)}
            type="alert"
            variant="destructive"
            title="Delete Invoice"
            description="Are you sure you want to delete this invoice? This action cannot be undone and the invoice record will be permanently removed."
            primaryAction={{
              label: "Delete",
              onClick: confirmDeleteInvoice,
              variant: "destructive",
              loading: isDeleting
            }}
            secondaryAction={{
              label: "Cancel",
              onClick: () => setInvoiceToDelete(null),
              disabled: isDeleting
            }}
          />

          <CentralizedModal
            isOpen={showBulkDeleteModal}
            onClose={() => !isBulkDeleting && setShowBulkDeleteModal(false)}
            type="alert"
            variant="destructive"
            title="Bulk Delete Invoices"
            description={`Are you sure you want to permanently delete ${selectedInvoices.length} selected invoices? This action cannot be undone.`}
            primaryAction={{
              label: `Delete ${selectedInvoices.length} Invoices`,
              onClick: confirmBulkDelete,
              variant: "destructive",
              loading: isBulkDeleting
            }}
            secondaryAction={{
              label: "Cancel",
              onClick: () => setShowBulkDeleteModal(false),
              disabled: isBulkDeleting
            }}
          />
        </div>
      </main>
    </div>
  );
}