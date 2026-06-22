// src/components/elements/image_block/schema.js
import { FiImage } from "react-icons/fi";

export const ImageBlockSchema = {
  type: "image_block",
  label: "Image Frame",
  icon: FiImage,
  baselineConfig: { url: "", maxHeight: 150, align: "center" },
  fields: {
    content: [{ id: "url", type: "text", label: "Absolute Image CDN URL String Link" }],
    style: [
      { id: "maxHeight", type: "number", label: "Restrict Max Height Bounds (px)" },
      { id: "align", type: "select", label: "Image Block Horizontal Alignment", options: [{ value: "left", label: "Left Aligned" }, { value: "center", label: "Center Aligned" }, { value: "right", label: "Right Aligned" }] }
    ]
  }
};