"use client";

import { Box, Button, Flex, Text, TextInput } from "@sanity/ui";
import { useState } from "react";
import { VscCheck, VscCopy } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "section-options",
  title: "Section options",
  type: "object",
  fields: [
    defineField({
      name: "hidden",
      type: "boolean",
      description: "Hide the section from the page",
      initialValue: false,
    }),
    defineField({
      name: "withTopDivider",
      title: "Show top divider",
      type: "boolean",
      description: "Show a horizontal line above the section",
      initialValue: false,
    }),
    defineField({
      name: "withBottomDivider",
      title: "Show bottom divider",
      type: "boolean",
      description: "Show a horizontal line below the section",
      initialValue: false,
    }),
    defineField({
      name: "colorTheme",
      title: "Color theme",
      type: "string",
      // No `initialValue` on purpose: a stored value overrides the section's own background,
      // so a default "light" would turn grey-by-design bands (stats, pricing) white on insert.
      description:
        "Section background: white, or the dark surface (which also inverts the text). Leave it unset to keep the section's own design background.",
      options: {
        list: [
          { title: "Light", value: "light" },
          { title: "Dark", value: "dark" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "uid",
      title: "Unique identifier",
      description: "Used for anchor/jump links (HTML `id` attribute).",
      type: "string",
      validation: (Rule) =>
        Rule.regex(/^[a-zA-Z0-9-]+$/g).error(
          "Must not contain spaces or special characters",
        ),
      components: {
        input: ({ elementProps, path }) => {
          const indexOfSection = path.indexOf("sections");
          const sectionKey = (path[indexOfSection + 1] as any)?._key;
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const [checked, setChecked] = useState(false);

          return (
            <Flex align="center" gap={1}>
              <Text muted>#</Text>

              <Box flex={1}>
                <TextInput
                  {...elementProps}
                  style={elementProps.style as React.CSSProperties}
                  placeholder={sectionKey}
                />
              </Box>

              <Button
                title="Click to copy"
                mode="ghost"
                icon={checked ? VscCheck : VscCopy}
                disabled={checked}
                onClick={() => {
                  navigator.clipboard.writeText("#" + (elementProps.value || sectionKey));

                  setChecked(true);
                  setTimeout(() => setChecked(false), 1000);
                }}
              />
            </Flex>
          );
        },
      },
    }),
  ],
});
