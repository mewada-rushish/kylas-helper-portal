// src/components/elements/video_block/schema.js
import { FiVideo } from "react-icons/fi";

export const VideoBlockSchema = {
  type: "video_block",
  label: "Video Reference",
  icon: FiVideo,
  baselineConfig: { url: "" },
  fields: {
    content: [{ id: "url", type: "text", label: "Target Reference Video Streaming Link URL" }],
    style: []
  }
};