import { resolveToken } from "@/lib/variable-resolver";
import { BaseStyleWrapper } from "./BaseStyleWrapper";

export const TextRenderer = ({ widget, context }) => (
  <BaseStyleWrapper widget={widget}>
    <div style={{ textAlign: widget.textAlign, fontSize: `${widget.fontSize || 14}px`, color: widget.textColor || "#0f172a" }}>
      <div dangerouslySetInnerHTML={{ __html: resolveToken(widget.text, context) }} />
    </div>
  </BaseStyleWrapper>
);

export const PricingTableRenderer = ({ widget, context }) => (
  <BaseStyleWrapper widget={widget}>
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ backgroundColor: widget.headerBg || "#f1f5f9" }}>
          <th style={{ padding: "8px", textAlign: "left" }}>{widget.col1Name || "Item"}</th>
          <th style={{ padding: "8px", textAlign: "center" }}>{widget.col2Name || "Qty"}</th>
          <th style={{ padding: "8px", textAlign: "right" }}>{widget.col3Name || "Total"}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ padding: "8px" }}>{resolveToken("{{product.name}}", context)}</td>
          <td style={{ padding: "8px", textAlign: "center" }}>{context.qty || 1}</td>
          <td style={{ padding: "8px", textAlign: "right" }}>{resolveToken("{{product.rate}}", context)}</td>
        </tr>
      </tbody>
    </table>
  </BaseStyleWrapper>
);

export const FinanceSummaryRenderer = ({ widget, context }) => (
  <BaseStyleWrapper widget={widget}>
    <div style={{ textAlign: "right", fontSize: "14px" }}>
      <div>Subtotal: {resolveToken("{{product.rate}}", context)}</div>
      <h3 style={{ margin: "4px 0" }}>Total: {resolveToken("{{invoice.total}}", context)}</h3>
    </div>
  </BaseStyleWrapper>
);

export const BankingRenderer = ({ widget, context }) => (
  <BaseStyleWrapper widget={widget}>
    <div style={{ fontSize: "12px", border: "1px dashed #cbd5e1", padding: "10px" }}>
      <strong>{resolveToken(widget.title || "Banking Details", context)}</strong>
      <div>Bank: {widget.bankName}</div>
      <div>IFSC: {widget.ifscCode}</div>
    </div>
  </BaseStyleWrapper>
);