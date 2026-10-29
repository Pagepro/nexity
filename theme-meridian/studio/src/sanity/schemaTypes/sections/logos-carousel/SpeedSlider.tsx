import { Box, Card, Flex, Text } from "@sanity/ui";
import { useCallback } from "react";
import { type NumberInputProps, set, unset } from "sanity";

const MIN = 1;
const MAX = 5;

// Sanity v4 dropped the number `range` option, so this renders a plain range input.
export function SpeedSlider(props: NumberInputProps) {
  const { onChange, value = 2 } = props;

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = Number(event.currentTarget.value);
      onChange(Number.isNaN(next) ? unset() : set(next));
    },
    [onChange],
  );

  return (
    <Card>
      <Flex align="center" gap={3}>
        <Text size={1} muted>
          Slow
        </Text>
        <Box flex={1}>
          <input
            type="range"
            min={MIN}
            max={MAX}
            step={1}
            value={value}
            onChange={handleChange}
            style={{ width: "100%", display: "block" }}
            aria-label="Scroll speed"
          />
        </Box>
        <Text size={1} muted>
          Fast
        </Text>
        <Text size={1} weight="semibold">
          {value}
        </Text>
      </Flex>
    </Card>
  );
}
