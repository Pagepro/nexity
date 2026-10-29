"use client";

import { Box, Button, Flex, Stack, Text, TextInput } from "@sanity/ui";
import { set, unset, type StringInputProps } from "sanity";

export interface MediaQuerySuggestion {
  label: string;
  query: string;
}

interface MediaQueryInputProps extends StringInputProps {
  suggestions: MediaQuerySuggestion[];
}

export function MediaQueryInput({
  elementProps,
  onChange,
  value,
  suggestions,
}: MediaQueryInputProps) {
  const handleSelect = (query: string) => onChange(query ? set(query) : unset());

  return (
    <Stack gap={2}>
      <Flex align="center" gap={2}>
        <Text size={1} muted>
          @media
        </Text>
        <Box flex={1}>
          <TextInput
            {...elementProps}
            style={elementProps.style as React.CSSProperties}
            onChange={(event) => handleSelect(event.currentTarget.value)}
          />
        </Box>
      </Flex>
      <Flex gap={1} wrap="wrap">
        {suggestions.map(({ label, query }) => (
          <Button
            key={query}
            text={label}
            title={query}
            fontSize={1}
            padding={2}
            mode={value === query ? "default" : "ghost"}
            tone={value === query ? "primary" : "default"}
            onClick={() => handleSelect(query)}
          />
        ))}
      </Flex>
    </Stack>
  );
}
