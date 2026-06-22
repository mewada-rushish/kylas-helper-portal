// src/components/elements/pricing_table/schema.js
import { FiList } from "react-icons/fi";

export const PricingTableSchema = {
  type: "pricing_table",
  label: "Pricing Table",
  icon: FiList,
  baselineConfig: { 
    columns: [{ label: "Item" }, { label: "Qty" }, { label: "Rate" }],
    items: [{ name: "{{product.name}}", qty: 1, rate: 0 }] 
  },
  fields: {
    content: [
      { id: "columns", type: "repeater", label: "Table Columns", fields: [{id: "label", type: "text"}] },
      { id: "items", type: "repeater", label: "Line Items", fields: [{id: "name", type: "text"}, {id: "qty", type: "number"}, {id: "rate", type: "number"}] }
    ],
    style: []
  }
};