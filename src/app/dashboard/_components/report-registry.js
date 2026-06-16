/* --- ASMITA CLUB & ERP REPORT CATALOG --- */
export const REPORT_CATALOG = [
  // WORKFLOW METRICS
  { id: "lead_ingestion", title: "Kylas Lead Ingestion Velocity", partition: "workflows", defaultSize: "2x1", defaultVis: "line" },
  { id: "visit_conversions", title: "Club Visit Conversion Funnel", partition: "workflows", defaultSize: "1x1", defaultVis: "bar" },
  { id: "automation_health", title: "CRM Messaging Success Margin", partition: "workflows", defaultSize: "1x1", defaultVis: "summary" },
  
  // INVOICE & FINANCIAL METRICS
  { id: "revenue_memberships", title: "Membership Revenue (Gold/Silver/Core)", partition: "invoices", defaultSize: "2x2", defaultVis: "line" },
  { id: "revenue_services", title: "Add-on Services (PT, Diet, Coaching)", partition: "invoices", defaultSize: "1x1", defaultVis: "bar" },
  { id: "revenue_rentals", title: "Event Venue Rentals (Hall & Lawn)", partition: "invoices", defaultSize: "1x1", defaultVis: "bar" },
  { id: "outstanding_pipeline", title: "Pending Renewals & Event Advances", partition: "invoices", defaultSize: "2x1", defaultVis: "bar" },
  { id: "document_volume", title: "Generated Invoices & Receipts", partition: "invoices", defaultSize: "1x1", defaultVis: "summary" }
];

/* --- DATA ENGINE --- */
export const MOCK_DATA_ENGINE = {
  lead_ingestion: { today: [14, 22, 19, 35, 42], last_week: [210, 245, 198, 312, 285] },
  visit_conversions: { today: [45, 38, 52, 61], last_week: [99.2, 99.5, 98.9, 99.1] },
  automation_health: { today: [99], last_week: [98.5] },
  
  revenue_memberships: { today: [25000, 40300, 22100, 15600], last_week: [145000, 182000, 168000] },
  revenue_services: { today: [6499, 1299, 1999, 4500], last_week: [45000, 52000, 38000] },
  revenue_rentals: { today: [0, 50000, 15000], last_week: [185000, 210000, 195000] },
  outstanding_pipeline: { today: [1200, 4500, 8000], last_week: [45000, 52000, 38000] },
  document_volume: { today: [18], last_week: [284] }
};