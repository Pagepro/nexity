import { Select, Stack, Text } from "@sanity/ui";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { type StringInputProps, set, unset, useClient, useFormValue } from "sanity";

import {
  DEFAULT_SCHEMA_PAGE_TYPE,
  ROUTED_DOCUMENT_TYPES,
  SCHEMA_PAGE_TYPES,
  schemaDefaultFieldName,
  schemaPageTypeTitle,
  type RoutedDocumentType,
} from "../schemaTypes/partials/schemaPageTypes";

const API_VERSION = process.env.SANITY_STUDIO_API_VERSION || "2024-12-01";

const SCHEMA_DEFAULTS_QUERY = `*[_type == "site"][0].structuredData.schemaDefaults`;

// Only labels the empty option. Never re-implement the precedence here: it lives
// (and is tested) in web/src/lib/schema-org/build-graph.ts.
export const SchemaPageTypeInput = (props: StringInputProps) => {
  const { value, onChange, elementProps } = props;

  const documentType = useFormValue(["_type"]) as RoutedDocumentType | undefined;
  const client = useClient({ apiVersion: API_VERSION });

  const [siteDefault, setSiteDefault] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isActive = true;
    client
      .fetch<Record<string, string | undefined> | null>(SCHEMA_DEFAULTS_QUERY)
      .then((defaults) => {
        if (!isActive || !documentType) return;
        setSiteDefault(defaults?.[schemaDefaultFieldName(documentType)]);
      })
      .catch(() => {
        if (isActive) setSiteDefault(undefined);
      });
    return () => {
      isActive = false;
    };
  }, [client, documentType]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextValue = event.currentTarget.value;
      onChange(nextValue ? set(nextValue) : unset());
    },
    [onChange],
  );

  const typeTitle =
    ROUTED_DOCUMENT_TYPES.find((type) => type.name === documentType)?.title ??
    "this type";
  const resolvedDefault =
    schemaPageTypeTitle(siteDefault) ?? schemaPageTypeTitle(DEFAULT_SCHEMA_PAGE_TYPE);

  return (
    <Stack gap={2}>
      <Select {...elementProps} value={value ?? ""} onChange={handleChange}>
        <option value="">
          Default for {typeTitle} ({resolvedDefault})
        </option>
        {SCHEMA_PAGE_TYPES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.title}
          </option>
        ))}
      </Select>
      <Text size={1} muted>
        The default comes from Site settings → Structured Data → Default page types.
      </Text>
    </Stack>
  );
};

export default SchemaPageTypeInput;
