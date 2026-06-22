// src/components/elements/pricing_table_pro/schema.js
import { FiList } from "react-icons/fi";

export const PricingTableProSchema = {
  type: "pricing_table_pro",
  label: "Pricing Table (Pro)",
  icon: FiList,
  baselineConfig: {
    items: [{ name: "{{product.name}}", qty: 1, rate: 45000, taxPct: 18 }],
    borderRadiusLayout: 4,
    borderColor: "#cbd5e1",
    headerBg: "#27347B",
    headerText: "#ffffff"
  },
  fields: {
    content: [
      {
        id: "items",
        type: "repeater",
        label: "Line Ledger Target Items Matrix",
        fields: [
          { id: "name", type: "text", label: "Line Item Description" },
          { id: "qty", type: "number", label: "Quantity" },
          { id: "rate", type: "number", label: "Base Price" },
          { id: "taxPct", type: "number", label: "Tax rate %" }
        ]
      }
    ],
    style: [
      { id: "borderRadiusLayout", type: "number", label: "Outer Container Border Radius (px)" },
      { id: "borderColor", type: "color", label: "Grid Cell Border Stroke lines Color" },
      { id: "headerBg", type: "color", label: "Header Fill Color" },
      { id: "headerText", type: "color", label: "Header Text Typography Label Color" }
    ]
  }
};