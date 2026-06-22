// src/components/elements/pricing_table/PricingTable.jsx
import { resolveToken } from "@/lib/variable-resolver";

export const PricingTable = ({ widget, context }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
    <thead>
      <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
        {widget.columns?.map((col, idx) => (
          <th key={idx} style={{ padding: "8px", textAlign: "left", fontSize: "12px", color: "#64748b" }}>
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {widget.items?.map((row, idx) => (
        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
          <td style={{ padding: "8px", fontSize: "13px" }}>{resolveToken(row.name, context)}</td>
          <td style={{ padding: "8px", fontSize: "13px" }}>{row.qty}</td>
          <td style={{ padding: "8px", textAlign: "right", fontSize: "13px" }}>₹{row.rate}</td>
        </tr>
      ))}
    </tbody>
  </table>
);