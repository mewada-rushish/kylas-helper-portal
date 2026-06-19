"use client";

import { useState } from "react";
import { 
  FiPlus, FiTrash2, FiCheckCircle, FiAlertCircle, 
  FiClock, FiX, FiSave
} from "react-icons/fi";
import Sidebar from "@/components/layout/sidebar/sidebar";
import AdminButton from "@/components/ui/button/button";
import Dropdown from "@/components/ui/dropdown/dropdown";
import styles from "./invoices.module.css";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Paid", value: "Paid" },
  { label: "Unpaid", value: "Unpaid" },
  { label: "Overdue", value: "Overdue" }
];

const INITIAL_INVOICES = [
  {
    id: "INV-2026-001",
    customer: "Acme Operations Corp",
    email: "billing@acme.org",
    date: "2026-06-15",
    dueDate: "2026-07-15",
    status: "Paid",
    currency: "INR",
    items: [
      { description: "Kylas Helper Portal API License Tier-3", qty: 1, rate: 45000 },
      { description: "High-Assurance Device Certificate Provisioning", qty: 5, rate: 2500 }
    ],
    taxRate: 18,
    discount: 5000
  },
  {
    id: "INV-2026-002",
    customer: "Apex Society Automation",
    email: "accounts@apexcommunity.in",
    date: "2026-06-18",
    dueDate: "2026-06-25",
    status: "Overdue",
    currency: "INR",
    items: [
      { description: "Smart Home IoT Gateway Integration Node", qty: 12, rate: 8500 },
      { description: "Dedicated DevOps Infrastructure Support Hours", qty: 10, rate: 3500 }
    ],
    taxRate: 18,
    discount: 0
  },
  {
    id: "INV-2026-003",
    customer: "AsmitA Club Operations",
    email: "management@asmitaclub.com",
    date: "2026-06-19",
    dueDate: "2026-07-19",
    status: "Unpaid",
    currency: "INR",
    items: [
      { description: "BBPS Core Settlement System Webhook Core", qty: 1, rate: 125000 }
    ],
    taxRate: 18,
    discount: 15000
  }
];

function calculateInvoiceTotals(invoice) {
  const subTotal = invoice.items.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const taxableAmount = Math.max(0, subTotal - invoice.discount);
  const tax = taxableAmount * (invoice.taxRate / 100);
  const total = taxableAmount + tax;
  return { subTotal, tax, total };
}

export default function InvoiceLedgerERP() {
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [filterStatus, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [customer, setCustomer] = useState("");
  const [email, setEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState([{ description: "", qty: 1, rate: 0 }]);

  const handleAddItemRow = () => {
    setItems([...items, { description: "", qty: 1, rate: 0 }]);
  };

  const handleUpdateItemRow = (index, field, value) => {
    setItems(items.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const handleRemoveItemRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== index));
    }
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    if (!customer || !email || !dueDate) return;

    const nextInvoiceId = `INV-2026-00${invoices.length + 1}`;
    const newInvoice = {
      id: nextInvoiceId,
      customer,
      email,
      date: new Date().toISOString().split('T')[0],
      dueDate,
      status: "Unpaid",
      currency: "INR",
      items: items.map(item => ({ ...item, qty: Number(item.qty), rate: Number(item.rate) })),
      taxRate: 18,
      discount: Number(discount)
    };

    setInvoices([newInvoice, ...invoices]);
    setIsModalOpen(false);

    setCustomer("");
    setEmail("");
    setDueDate("");
    setDiscount(0);
    setItems([{ description: "", qty: 1, rate: 0 }]);
  };

  const filteredInvoices = invoices.filter(inv => filterStatus === "all" || inv.status === filterStatus);

  const stats = invoices.reduce((acc, inv) => {
    const { total } = calculateInvoiceTotals(inv);
    if (inv.status === "Paid") acc.collected += total;
    if (inv.status === "Unpaid") acc.pending += total;
    if (inv.status === "Overdue") acc.overdue += total;
    return acc;
  }, { collected: 0, pending: 0, overdue: 0 });

  return (
    <div className={styles.adminLayout}>
      <Sidebar activeId="invoices" />

      <main className={styles.mainCanvas}>
        <div className={styles.pageMaxWidth}>
          <header className={styles.pageHeader}>
            <div className={styles.headerTitle}>
              <h1>Financial ERP Ledger</h1>
              <p>Manage community operations invoicing and BBPS processing channels</p>
            </div>
            <div className={styles.headerActions}>
              <AdminButton variant="primary" icon={FiPlus} onClick={() => setIsModalOpen(true)}>
                Generate New Invoice
              </AdminButton>
            </div>
          </header>

          <div className={styles.metricsStripSummary}>
            <div className={`${styles.metricTile} ${styles.tileCollected}`}>
              <div className={styles.tileLeft}>
                <span className={styles.tileLabel}>Net Collections</span>
                <h3>₹{stats.collected.toLocaleString("en-IN")}</h3>
              </div>
              <FiCheckCircle className={styles.tileIcon} />
            </div>
            <div className={`${styles.metricTile} ${styles.tilePending}`}>
              <div className={styles.tileLeft}>
                <span className={styles.tileLabel}>Outstanding Ledger</span>
                <h3>₹{stats.pending.toLocaleString("en-IN")}</h3>
              </div>
              <FiClock className={styles.tileIcon} />
            </div>
            <div className={`${styles.metricTile} ${styles.tileOverdue}`}>
              <div className={styles.tileLeft}>
                <span className={styles.tileLabel}>Delinquent Accounts</span>
                <h3>₹{stats.overdue.toLocaleString("en-IN")}</h3>
              </div>
              <FiAlertCircle className={styles.tileIcon} />
            </div>
          </div>

          <div className={styles.toolbarActionBlockRow}>
            <div className="dropdownContainerParent" style={{ width: "200px" }}>
              <Dropdown options={STATUS_OPTIONS} selectedValue={filterStatus} onSelect={(val) => setStatusFilter(val)} />
            </div>
          </div>

          <div className={styles.tableCardFrame}>
            <table className={styles.invoiceTableGrid}>
              <thead>
                <tr>
                  <th>Invoice Identifier</th>
                  <th>Customer Target Account</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Gross Value</th>
                  <th>Lifecycle Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={styles.emptyState}>No records match the selected filtering bounds.</td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const { total } = calculateInvoiceTotals(invoice);
                    return (
                      <tr key={invoice.id}>
                        <td className={styles.fontCodeIdentity}>{invoice.id}</td>
                        <td>
                          <div className={styles.customerStackCell}>
                            <span className={styles.custPrimaryName}>{invoice.customer}</span>
                            <span className={styles.custSubEmail}>{invoice.email}</span>
                          </div>
                        </td>
                        <td className={styles.dateStampCell}>{invoice.date}</td>
                        <td className={styles.dateStampCell}>{invoice.dueDate}</td>
                        <td className={styles.valueTotalBoldCell}>₹{total.toLocaleString("en-IN")}</td>
                        <td>
                          <span className={`${styles.statusLabelBadge} ${styles[`status_${invoice.status.toLowerCase()}`]}`}>
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {isModalOpen && (
            <div className={styles.modalViewportOverlay} onClick={() => setIsModalOpen(false)}>
              <div className={styles.modalContentCardSheet} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeaderTitleArea}>
                  <h3>Compile Operations Bill Segment</h3>
                  <button className={styles.modalCloseBtnCross} onClick={() => setIsModalOpen(false)}><FiX /></button>
                </div>

                <form onSubmit={handleCreateInvoice} className={styles.invoiceInteractiveFormStack}>
                  <div className={styles.formRowTwoColumnGrid}>
                    <div className={styles.inputFieldGroupBlock}>
                      <label>Legal Corporate Entity Name</label>
                      <input type="text" placeholder="Acme Inc..." value={customer} onChange={(e) => setCustomer(e.target.value)} required />
                    </div>
                    <div className={styles.inputFieldGroupBlock}>
                      <label>Accounts Payable Communication Email</label>
                      <input type="email" placeholder="billing@entity.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </div>

                  <div className={styles.formRowTwoColumnGrid}>
                    <div className={styles.inputFieldGroupBlock}>
                      <label>Payment Deadline Coordinate (Due Date)</label>
                      <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
                    </div>
                    <div className={styles.inputFieldGroupBlock}>
                      <label>Discretionary Discount Deductible (INR)</label>
                      <input type="number" min="0" placeholder="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                    </div>
                  </div>

                  <div className={styles.repeaterSectionBlock}>
                    <label className={styles.repeaterOuterSectionHeadingLabel}>Billable Purchase Line Items</label>
                    <div className={styles.repeaterItemsContainerStack}>
                      {items.map((item, index) => (
                        <div key={index} className={styles.repeaterRowItemFlexLine}>
                          <input 
                            type="text" placeholder="Description of service rendered..." style={{ flex: 3 }} value={item.description}
                            onChange={(e) => handleUpdateItemRow(index, "description", e.target.value)} required 
                          />
                          <input 
                            type="number" min="1" placeholder="Qty" style={{ flex: 0.6 }} value={item.qty}
                            onChange={(e) => handleUpdateItemRow(index, "qty", e.target.value)} required 
                          />
                          <input 
                            type="number" min="0" placeholder="Rate (₹)" style={{ flex: 1.2 }} value={item.rate}
                            onChange={(e) => handleUpdateItemRow(index, "rate", e.target.value)} required 
                          />
                          <button type="button" disabled={items.length === 1} className={styles.repeaterDeleteLineBtn} onClick={() => handleRemoveItemRow(index)}>
                            <FiTrash2 />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button type="button" className={styles.repeaterAddNewRowTextBtnLink} onClick={handleAddItemRow}>
                      <FiPlus /> Add New Service Line Element
                    </button>
                  </div>

                  <div className={styles.modalFooterActionsBlockRow}>
                    <AdminButton variant="secondary" onClick={() => setIsModalOpen(false)}>Discard Draft</AdminButton>
                    <AdminButton variant="primary" icon={FiSave} type="submit">Compile & Dispatch Invoice</AdminButton>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}