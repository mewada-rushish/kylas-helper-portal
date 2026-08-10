import Handlebars from "handlebars";
import DOMPurify from "isomorphic-dompurify";

const KYLAS_PRODUCTS = [
  { value: "prod_crm_ent", label: "Kylas CRM Premium Enterprise License" },
  { value: "prod_iot_node", label: "Smart Home IoT Sensor Node (AsmitA Hub)" },
  { value: "prod_bbps_gw", label: "BBPS Settlement Core Gateway API" },
  { value: "prod_devops_supp", label: "Dedicated Cloud DevOps Maintenance Hours" }
];

export const resolveToken = (content, context = {}) => {
  if (!content) return "";
  
  const prodObj = KYLAS_PRODUCTS.find(p => p.value === context.productId);

  // Build the complete data model for Handlebars
  const hbsData = {
    ...context,
    invoice: {
      id: context.id || "INV-DEMO-99",
      total: `₹${(context.total || 53100).toLocaleString("en-IN")}`,
      ...context.invoice
    },
    customer: {
      name: context.customer || "Alpha Society Test Corp",
      email: context.email || "finance@alphacorp.in",
      ...context.customer
    },
    product: {
      name: prodObj?.label || context.productId || "Standard Service",
      rate: `₹${(context.rate || 45000).toLocaleString("en-IN")}`,
      qty: context.qty || 1,
      ...context.product
    },
    current: {
      date: context.date || new Date().toISOString().split("T")[0],
      ...context.current
    }
  };

  try {
    const template = Handlebars.compile(content);
    const resolved = template(hbsData);
    return DOMPurify.sanitize(resolved);
  } catch (error) {
    console.error("Handlebars compilation error:", error);
    return DOMPurify.sanitize(content); // Fallback to raw content if template fails
  }
};