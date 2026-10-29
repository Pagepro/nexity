import { Flex, Stack, Text, TextArea, TextInput } from "@sanity/ui";
import type { StringInputProps } from "sanity";

interface CharacterCountInputProps extends StringInputProps {
  limit: number;
  multiline?: boolean;
  children?: React.ReactNode;
}

export function CharacterCountInput({
  elementProps,
  limit,
  multiline = false,
  children,
}: CharacterCountInputProps) {
  const length = elementProps.value?.length ?? 0;
  const isOverLimit = length > limit;
  const style = elementProps.style as React.CSSProperties;

  return (
    <Stack gap={2}>
      {multiline ? (
        <TextArea {...elementProps} style={style} />
      ) : (
        <TextInput {...elementProps} style={style} />
      )}
      <Flex align="center" justify="space-between" gap={2}>
        <div>{children}</div>
        <Text size={1} muted={!isOverLimit} weight={isOverLimit ? "semibold" : "regular"}>
          <span
            style={
              isOverLimit ? { color: "var(--card-badge-caution-fg-color)" } : undefined
            }
          >
            {length} / {limit}
          </span>
        </Text>
      </Flex>
    </Stack>
  );
}
