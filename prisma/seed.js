const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting DB seed...");

  const hashedPassword = await bcrypt.hash("Asmita@123#", 10);

  // Clear existing users
  await prisma.user.deleteMany({});

  // 1. Create a dummy User
  const user = await prisma.user.upsert({
    where: { email: "rushish.mewada@asmitagroup.com" },
    update: {
      password: hashedPassword
    },
    create: {
      email: "rushish.mewada@asmitagroup.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });
  console.log("Seeded User:", user.email);

  // Clear existing items to prevent duplicates if ran multiple times
  await prisma.workflowRule.deleteMany({});
  await prisma.invoiceTemplate.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.syncLog.deleteMany({});

  // 2. Create WorkflowRules
  const workflows = [
    {
      name: "High-Value Deal Routing",
      trigger: "deal.won",
      status: "active",
      nodesCount: 4,
      config: JSON.stringify({ version: "1.0", nodes: [] }),
    },
    {
      name: "Website Lead Distribution",
      trigger: "lead.created",
      status: "active",
      nodesCount: 6,
      config: JSON.stringify({ version: "1.0", nodes: [] }),
    },
    {
      name: "VIP Customer Welcome",
      trigger: "contact.updated",
      status: "draft",
      nodesCount: 2,
      config: JSON.stringify({ version: "1.0", nodes: [] }),
    }
  ];

  for (const wf of workflows) {
    await prisma.workflowRule.create({ data: wf });
  }
  console.log("Seeded WorkflowRules");

  // 3. Create InvoiceTemplates
  await prisma.invoiceTemplate.create({
    data: {
      name: "Standard PDF Layout Master",
      isDefault: true,
      attachedProductId: null,
      config: JSON.stringify({ columns: 2, showLogo: true }),
      theme: JSON.stringify({ primaryColor: "#27347B", textColor: "#202223", backgroundColor: "#ffffff", borderColor: "#e1e3e5" }),
    }
  });
  console.log("Seeded InvoiceTemplates");

  // 4. Create Invoices
  await prisma.invoice.create({
    data: {
      id: "INV-2026-001",
      customer: "Acme Corporate Entity",
      email: "finance@acme.com",
      date: new Date("2026-06-18T00:00:00Z"),
      productId: "prod_crm_ent",
      qty: 2,
      rate: 45000,
      total: 90000,
    }
  });

  await prisma.invoice.create({
    data: {
      id: "INV-2026-002",
      customer: "Society Hub Operations",
      email: "accounts@societyhub.in",
      date: new Date("2026-06-19T00:00:00Z"),
      productId: "prod_iot_node",
      qty: 10,
      rate: 3500,
      total: 35000,
    }
  });
  console.log("Seeded Invoices");

  // 5. Create SyncLogs
  await prisma.syncLog.create({
    data: {
      leadId: "lead_9921",
      status: "SUCCESS",
      payload: JSON.stringify({ name: "John Doe", email: "john@example.com" }),
      attempts: 1,
    }
  });
  console.log("Seeded SyncLogs");

  // 6. Create sample Webhooks
  await prisma.webhook.deleteMany({});
  const webhooks = [
    {
      name: "Kylas CRM Lead Ingestion Hook",
      triggerType: "LEAD_CREATED",
      category: "Kylas",
      method: "POST",
      url: "https://api.kylas.io/v1/hooks/leads/capture",
      isActive: true,
      headers: JSON.stringify([
        { key: "Authorization", value: "Bearer kylas_prod_sec_token_9910a", isSecret: true, isVisible: false },
        { key: "Content-Type", value: "application/json", isSecret: false, isVisible: true }
      ]),
      queryParams: JSON.stringify([
        { key: "environment", value: "production" },
        { key: "sync_mode", value: "async" }
      ]),
      bodyPayload: JSON.stringify({ event: "lead.created", payload: { lead_id: "{{lead.id}}", owner_email: "{{user.email}}" } }, null, 2),
      selectedVariables: JSON.stringify(["response.data.integrationId", "response.status"]),
    },
    {
      name: "Society Financial Ledger Sync",
      triggerType: "INVOICE_GENERATED",
      category: "Payment",
      method: "PUT",
      url: "https://api.asmitaclub.com/v2/erp/ledger/update",
      isActive: true,
      headers: JSON.stringify([
        { key: "X-BBPS-Auth-Token", value: "bbps_sec_77a1bc", isSecret: true, isVisible: false },
        { key: "Accept", value: "application/json", isSecret: false, isVisible: true }
      ]),
      queryParams: JSON.stringify([{ key: "auto_approve", value: "true" }]),
      bodyPayload: JSON.stringify({ invoice_ref: "{{invoice.title}}", amount_cents: "{{invoice.total}}", status: "QUEUED" }, null, 2),
      selectedVariables: JSON.stringify(["response.record.sync_reference"]),
    },
    {
      name: "Custom Analytics Stream Log",
      triggerType: "SYSTEM_ALERT",
      category: "Custom",
      method: "POST",
      url: "https://analytics.internal.local/stream",
      isActive: false,
      headers: JSON.stringify([{ key: "Content-Type", value: "application/json", isSecret: false, isVisible: true }]),
      queryParams: JSON.stringify([]),
      bodyPayload: JSON.stringify({ alert_level: "WARN", message: "System sync failed: {{syncLog.leadId}}" }, null, 2),
      selectedVariables: JSON.stringify([]),
    }
  ];
  for (const wh of webhooks) {
    await prisma.webhook.create({ data: wh });
  }
  console.log("Seeded Webhooks");

  console.log("Database seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
