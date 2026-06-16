// Mock dataset structured exactly like our planned MySQL schema
const mockSyncLogs = [
  { 
    id: 1, 
    leadId: "LEAD-2026-001", 
    status: "SUCCESS", 
    payload: '{"name": "Arjun Mehta", "email": "arjun@example.com", "phone": "+919876543210"}', 
    createdAt: "2026-06-16 10:34" 
  },
  { 
    id: 2, 
    leadId: "LEAD-2026-002", 
    status: "QUEUED", 
    payload: '{"name": "Neha Sharma", "email": "neha@example.com", "phone": "+919876543211"}', 
    createdAt: "2026-06-16 11:15" 
  },
  { 
    id: 3, 
    leadId: "LEAD-2026-003", 
    status: "FAILED", 
    payload: '{"name": "Rohan Gupta", "email": "rohan@example.com", "phone": "+919876543212"}', 
    errorMessage: "Kylas API authorization token expired", 
    createdAt: "2026-06-16 12:02" 
  }
];

const mockWorkflowRules = [
  { id: 1, name: "High-Value Lead Routing", triggerType: "META_LEAD", isActive: true },
  { id: 2, name: "Auto-Tag Mumbai Operations", triggerType: "META_LEAD", isActive: true },
  { id: 3, name: "Weekend Fallback Queue", triggerType: "META_LEAD", isActive: false }
];

const mockInvoices = [
  { id: 101, title: "INV-2026-054", client: "Acme Corp", amount: "₹45,000", status: "PAID", createdAt: "2026-06-10" },
  { id: 102, title: "INV-2026-055", client: "Verdant Solutions", amount: "₹12,500", status: "PENDING", createdAt: "2026-06-14" }
];

export async function getDashboardMetrics() {
  return {
    totalProcessed: 1428,
    queuedCount: 1,
    successRate: "99.1%",
    activeWorkflows: mockWorkflowRules.filter(r => r.isActive).length
  };
}

export async function getRecentLogs() {
  return mockSyncLogs;
}

export async function getWorkflowRules() {
  return mockWorkflowRules;
}

export async function getRecentInvoices() {
  return mockInvoices;
}