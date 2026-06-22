// src/components/elements/text_block/schema.js
import { FiAlignLeft } from "react-icons/fi";

export const TextBlockSchema = {
  type: "text_block",
  label: "Rich Text Paragraph",
  icon: FiAlignLeft,
  baselineConfig: { text: "Paragraph block writing layer..." },
  fields: {
    content: [{ id: "text", type: "wysiwyg", label: "Editor Canvas" }],
    style: []
  }
};