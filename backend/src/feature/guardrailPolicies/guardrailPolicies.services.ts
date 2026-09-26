type GuardrailRuleInput = {
  type: string;
  name: string;
  action: string;
  enabled?: boolean;
  threshold?: number | null;
  config?: Prisma.InputJsonObject;
  priority?: number | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJsonContent(value: unknown): value is Prisma.InputJsonValue | null {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonContent);
  }

  return isRecord(value) && Object.values(value).every(isJsonContent);
}

function isJsonObject(value: unknown): value is Prisma.InputJsonObject {
  return isRecord(value) && Object.values(value).every(isJsonContent);
}

function isGuardrailRule(value: unknown): value is GuardrailRuleInput {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.type === "string" &&
    value.type.trim() !== "" &&
    typeof value.name === "string" &&
    value.name.trim() !== "" &&
    typeof value.action === "string" &&
    value.action.trim() !== "" &&
    (value.enabled === undefined || typeof value.enabled === "boolean") &&
    (value.threshold === undefined ||
      value.threshold === null ||
      (typeof value.threshold === "number" && Number.isFinite(value.threshold))) &&
    (value.config === undefined || isJsonObject(value.config)) &&
    (value.priority === undefined ||
      value.priority === null ||
      (typeof value.priority === "number" && Number.isInteger(value.priority)))
  );
}

function isGuardrailRuleArray(value: unknown): value is GuardrailRuleInput[] {
  return Array.isArray(value) && value.every(isGuardrailRule);
}

export { isGuardrailRule, isGuardrailRuleArray,isRecord };
