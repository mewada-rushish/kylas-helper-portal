import { FiSliders } from "react-icons/fi";

export const FooterControls = {
  type: "footer",
  label: "Footer dynamic strip",
  icon: FiSliders,
  baselineConfig: {
    text: "Generated securely via AsmitA Core ERP Infrastructure Stack.",
    htmlTag: "p",
    textAlign: "center",
    fontSize: 11,
    textColor: "#64748b"
  },
  fields: {
    content: [
      { 
        id: "htmlTag", 
        label: "HTML Element Tag", 
        type: "select", 
        options: [
          { value: "p", label: "Paragraph Standard" },
          { value: "h5", label: "Heading H5" },
          { value: "h6", label: "Heading H6" }
        ] 
      },
      { id: "text", label: "Footer Copy Text", type: "textarea", rows: 3 }
    ],
    style: [
      { id: "textColor", label: "Font Hex Color", type: "color" },
      { id: "textAlign", label: "Alignment Grid Axis", type: "alignment_picker" },
      { id: "fontSize", label: "Size (px)", type: "number" }
    ]
  }
};