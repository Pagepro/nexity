import cloneDeep from "lodash/cloneDeep";
import get from "lodash/get";
import isArray from "lodash/isArray";
import mergeWith from "lodash/mergeWith";
import set from "lodash/set";
import { ImSection } from "react-icons/im";
import { FieldDefinition } from "sanity";

import { ModelType } from "../types";

const addSectionIcon = (section: ModelType) => {
  const PREPARE_PATH = "preview.prepare";

  const prepare = get(section, PREPARE_PATH);

  if (!prepare) {
    set(section, PREPARE_PATH, () => ({
      media: ImSection,
    }));

    return;
  }

  set(section, PREPARE_PATH, (...args: Parameters<typeof prepare>) => {
    const prepareResult = prepare(...args);

    return {
      media: ImSection,
      ...prepareResult,
    };
  });
};

const mergeFieldsArray = (srcFields: FieldDefinition[], destFields: FieldDefinition[]) =>
  [...srcFields, ...destFields].reduce<FieldDefinition[]>((acc, field) => {
    const duplicateIndex = acc.findIndex(({ name }) => field.name === name);

    if (duplicateIndex < 0) {
      return [...acc, field];
    }

    return [...acc.slice(0, duplicateIndex), field, ...acc.slice(duplicateIndex + 1)];
  }, []);

const replaceFields = (
  fields: FieldDefinition[],
  config: {
    fieldToReplaceName: string;
    replacementName: string;
  }[],
) => {
  if (!Array.isArray(config) || config.length <= 0) {
    return fields;
  }

  const replacedFields = fields.reduce<FieldDefinition[]>((acc, field) => {
    const replaceConfig = config.find((item) => item.fieldToReplaceName === field.name);

    if (!replaceConfig) {
      return [...acc, field];
    }

    const { replacementName } = replaceConfig;
    const replacement = fields.find(
      (replacementField) => replacementField.name === replacementName,
    );

    return replacement ? [...acc, replacement] : acc;
  }, []);

  return replacedFields.reduce<FieldDefinition[]>((acc, field) => {
    const replaceConfig = config.find((item) => item.replacementName === field.name);

    if (!replaceConfig) {
      return [...acc, field];
    }

    const numberOfDuplicates = acc.filter((item) => item.name === field.name).length;

    if (numberOfDuplicates <= 0) {
      return [...acc, field];
    }

    return acc;
  }, []);
};

export const extendModel = <TModel extends ModelType>(
  model: TModel,
  extensionModel: Omit<Partial<TModel>, "name"> & {
    name: string;
    isSection?: boolean;
  },
  {
    arrayJoinOrder = "destToSource",
    fieldsToSkip = [],
    arrayOfMembersToSkip = [],
    fieldsToReplace = [],
    preserveGroupsOrder = false,
    overrideSectionMediaPreview = true,
  }: {
    arrayJoinOrder?: "default" | "reverse" | "destToSource" | "sourceToDest";
    fieldsToSkip?: string[];
    arrayOfMembersToSkip?: string[];
    fieldsToReplace?: {
      fieldToReplaceName: string;
      replacementName: string;
    }[];
    preserveGroupsOrder?: boolean;
    overrideSectionMediaPreview?: boolean;
  } = {},
) => {
  const modelClone = cloneDeep(model);

  if ("fields" in modelClone && Array.isArray(modelClone.fields)) {
    modelClone.fields = modelClone.fields.filter(
      ({ name }) => !fieldsToSkip.includes(name),
    );
  }

  if ("of" in modelClone && Array.isArray(modelClone.of)) {
    modelClone.of = modelClone.of.filter(
      (member) => member.name && !arrayOfMembersToSkip.includes(member.name),
    );
  }

  const newModel = mergeWith(modelClone, extensionModel, (objValue, srcValue, key) => {
    if (isArray(objValue) && isArray(srcValue)) {
      if (arrayJoinOrder === "sourceToDest") {
        if (preserveGroupsOrder && key === "groups") {
          return objValue.concat(srcValue);
        }

        return key === "fields"
          ? replaceFields(mergeFieldsArray(srcValue, objValue), fieldsToReplace)
          : srcValue.concat(objValue);
      }

      return key === "fields"
        ? replaceFields(mergeFieldsArray(objValue, srcValue), fieldsToReplace)
        : objValue.concat(srcValue);
    }

    return undefined;
  });

  if (newModel.isSection && overrideSectionMediaPreview) {
    addSectionIcon(newModel);
  }

  return newModel;
};
