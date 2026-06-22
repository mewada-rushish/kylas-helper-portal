// src/components/elements/video_block/index.js
import { VideoBlock } from "./VideoBlock";
import { VideoBlockSchema } from "./schema";
import { BaseStyleWrapper } from "../BaseStyleWrapper";

export const VideoBlockElement = {
  component: ({ widget, context }) => (
    <BaseStyleWrapper widget={widget}>
      <VideoBlock widget={widget} context={context} />
    </BaseStyleWrapper>
  ),
  config: VideoBlockSchema
};