// src/components/elements/image_block/index.js
import { ImageBlock } from "./ImageBlock";
import { ImageBlockSchema } from "./schema";
import { BaseStyleWrapper } from "../BaseStyleWrapper";

export const ImageBlockElement = {
  component: ({ widget, context }) => (
    <BaseStyleWrapper widget={widget}>
      <ImageBlock widget={widget} context={context} />
    </BaseStyleWrapper>
  ),
  config: ImageBlockSchema
};