// src/components/elements/pricing_table_pro/PricingTablePro.jsx
import { resolveToken } from "@/lib/variable-resolver";

export const PricingTablePro = ({ widget, context }) => {
  const itemsList = widget.items || [];
  
  const borderRule = `1px solid ${widget.borderColor || "#cbd5e1"}`;
  
  const tableContainerStyles = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    borderRadius: `${widget.borderRadiusLayout ?? 4}px`,
    border: borderRule,
    overflow: "hidden"
  };

  const thStyle = {
    backgroundColor: widget.headerBg || "#27347B",
    color: widget.headerText || "#ffffff",
    padding: "12px",
    fontWeight: "600",
    fontSize: "12px",
    borderBottom: borderRule,
    borderRight: borderRule
  };

  const tdStyle = {
    padding: "12px",
    fontSize: "13px",
    color: "#334155",
    borderBottom: borderRule,
    borderRight: borderRule
  };

  return (
    <table style={tableContainerStyles}>
      <thead>
        <tr>
          <th style={{ ...thStyle, textAlign: "left" }}>Description Item</th>
          <th style={{ ...thStyle, textAlign: "center", width: "60px" }}>Qty</th>
          <th style={{ ...thStyle, textAlign: "right", width: "100px" }}>Unit Rate</th>
          <th style={{ ...thStyle, textAlign: "right", width: "80px" }}>Tax</th>
          <th style={{ ...thStyle, textAlign: "right", width: "110px", borderRight: "none" }}>Net Line Value</th>
        </tr>
      </thead>
      <tbody>
        {itemsList.map((row, index) => {
          const isLastRow = index === itemsList.length - 1;
          const rowTdStyle = isLastRow ? { ...tdStyle, borderBottom: "none" } : tdStyle;
          
          const rawQty = Number(row.qty) || 0;
          const rawRate = Number(row.rate) || 0;
          const taxPct = Number(row.taxPct) || 0;
          const netTotal = rawQty * rawRate * (1 + taxPct / 100);

          return (
            <tr key={index}>
              <td style={rowTdStyle}>{resolveToken(row.name, context)}</td>
              <td style={{ ...rowTdStyle, textAlign: "center" }}>{rawQty}</td>
              <td style={{ ...rowTdStyle, textAlign: "right" }}>₹{rawRate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td style={{ ...rowTdStyle, textAlign: "right" }}>{taxPct}%</td>
              <td style={{ ...rowTdStyle, textAlign: "right", borderRight: "none" }}>₹{netTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};