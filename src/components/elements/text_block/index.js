// src/components/elements/text_block/index.js
import { TextBlock } from "./TextBlock";
import { TextBlockSchema } from "./schema";
import { BaseStyleWrapper } from "../BaseStyleWrapper";

export const TextBlockElement = {
  component: ({ widget, context }) => (
    <BaseStyleWrapper widget={widget}>
      <TextBlock widget={widget} context={context} />
    </BaseStyleWrapper>
  ),
  config: TextBlockSchema
};