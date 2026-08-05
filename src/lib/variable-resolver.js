// src/lib/variable-resolver.js
import DOMPurify from "isomorphic-dompurify";

const KYLAS_PRODUCTS = [
  { value: "prod_crm_ent", label: "Kylas CRM Premium Enterprise License" },
  { value: "prod_iot_node", label: "Smart Home IoT Sensor Node (AsmitA Hub)" },
  { value: "prod_bbps_gw", label: "BBPS Settlement Core Gateway API" },
  { value: "prod_devops_supp", label: "Dedicated Cloud DevOps Maintenance Hours" }
];

const getValueFromPath = (obj, path) => {
  if (!obj || !path) return undefined;
  // Convert bracket notation to dot notation: phoneNumbers[0].value -> phoneNumbers.0.value
  const normalizedPath = path.replace(/\[(\w+)\]/g, '.$1');
  const properties = normalizedPath.split('.');
  
  let current = obj;
  for (const prop of properties) {
    if (current === undefined || current === null) return undefined;
    current = current[prop];
  }
  return current;
};

export const resolveToken = (content, context = {}) => {
  if (!content) return "";
  
  const prodObj = KYLAS_PRODUCTS.find(p => p.value === context.productId);
  const escapeHtml = (unsafe) => String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Comprehensive production dictionary token mapping matching current context rules
  const tokens = {
    "{{invoice.id}}": escapeHtml(context.id || "INV-DEMO-99"),
    "{{customer.name}}": escapeHtml(context.customer || "Alpha Society Test Corp"),
    "{{customer.email}}": escapeHtml(context.email || "finance@alphacorp.in"),
    "{{product.name}}": escapeHtml(prodObj?.label || context.productId || "Standard Service"),
    "{{product.rate}}": escapeHtml(`₹${(context.rate || 45000).toLocaleString("en-IN")}`),
    "{{product.qty}}": escapeHtml(context.qty || 1),
    "{{invoice.total}}": escapeHtml(`₹${(context.total || 53100).toLocaleString("en-IN")}`),
    "{{current.date}}": escapeHtml(context.date || new Date().toISOString().split("T")[0])
  };

  // 1. Resolve explicit known legacy tokens first
  let resolved = content;
  Object.keys(tokens).forEach((token) => {
    resolved = resolved.replace(new RegExp(token, "g"), tokens[token]);
  });

  // 2. Resolve dynamic dot-notation tokens based on the context object
  resolved = resolved.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getValueFromPath(context, path.trim());
    if (value !== undefined) {
      if (typeof value === 'object') {
        return escapeHtml(JSON.stringify(value));
      }
      return escapeHtml(String(value));
    }
    return match; // Leave untouched if not found in context
  });

  return DOMPurify.sanitize(resolved);
};