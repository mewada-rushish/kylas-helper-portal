// src/lib/variable-resolver.js
import DOMPurify from "isomorphic-dompurify";

export const resolveToken = (content, context = {}) => {
  if (!content) return "";
  
  // Maps tokens to context data
  const tokens = {
    "{{invoice.id}}": context.id || "INV-000",
    "{{customer.name}}": context.customer || "Valued Client",
    "{{customer.email}}": context.email || "N/A",
    "{{product.name}}": context.productName || "Standard Service",
    "{{product.rate}}": `₹${(context.rate || 0).toLocaleString("en-IN")}`,
    "{{product.qty}}": context.qty || 1,
    "{{invoice.total}}": `₹${(context.total || 0).toLocaleString("en-IN")}`,
    "{{current.date}}": new Date().toLocaleDateString("en-IN")
  };

  let resolved = content;
  Object.keys(tokens).forEach((token) => {
    resolved = resolved.replace(new RegExp(token, "g"), tokens[token]);
  });

  return DOMPurify.sanitize(resolved);
};