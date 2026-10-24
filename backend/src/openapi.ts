const idParameter = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};

const organizationFilter = {
  name: "organization_id",
  in: "query",
  schema: { type: "string", format: "uuid" },
};

const projectFilter = {
  name: "project_id",
  in: "query",
  schema: { type: "string", format: "uuid" },
};

const policyFilter = {
  name: "policy_id",
  in: "query",
  schema: { type: "string", format: "uuid" },
};

const requestBody = (schema: string) => ({
  required: true,
  content: {
    "application/json": {
      schema: { $ref: `#/components/schemas/${schema}` },
    },
  },
});

const successResponse = {
  "200": { description: "Request completed successfully." },
  "400": { description: "The request contains invalid input." },
  "404": { description: "The requested resource was not found." },
  "500": { description: "An unexpected server error occurred." },
};

const createResponse = {
  ...successResponse,
  "201": { description: "Resource created successfully." },
  "409": { description: "The request conflicts with an existing resource." },
};

const readCollection = (summary: string, parameters: object[] = []) => ({
  get: {
    summary,
    parameters,
    responses: successResponse,
  },
});

const createResource = (summary: string, schema = "ResourceInput") => ({
  post: {
    summary,
    requestBody: requestBody(schema),
    responses: createResponse,
  },
});

const readResource = (summary: string) => ({
  get: {
    summary,
    parameters: [idParameter],
    responses: successResponse,
  },
});

const updateResource = (summary: string, schema = "ResourceInput") => ({
  patch: {
    summary,
    parameters: [idParameter],
    requestBody: requestBody(schema),
    responses: successResponse,
  },
});

const deleteResource = (summary: string) => ({
  delete: {
    summary,
    parameters: [idParameter],
    responses: {
      "204": { description: "Resource deleted or revoked successfully." },
      "400": { description: "The request contains invalid input." },
      "404": { description: "The requested resource was not found." },
      "409": { description: "The operation conflicts with related resources." },
    },
  },
});

const rawOpenApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "TrustForge Backend API",
    version: "1.0.0",
    description:
      "Interactive documentation for the TrustForge Express API. Resource endpoints are served under `/v1`. Related organization, project, and policy identifiers must reference existing records.",
  },
  servers: [{ url: "/v1", description: "Current TrustForge backend host" }],
  tags: [
    { name: "Organizations" },
    { name: "Users" },
    { name: "Members" },
    { name: "Projects" },
    { name: "Providers" },
    { name: "Models" },
    { name: "Provider model aliases" },
    { name: "Routing rules" },
    { name: "API keys" },
    { name: "Guardrail policies" },
    { name: "Detection rules" },
    { name: "Transformation rules" },
    { name: "Guardrail events" },
    { name: "Usage logs" },
    { name: "Classification" },
  ],
  paths: {
    "/organizations": {
      ...readCollection("List organizations"),
      ...createResource("Create an organization", "OrganizationInput"),
    },
    "/organizations/{id}": {
      ...readResource("Get an organization and its related resources"),
      ...updateResource("Update an organization", "OrganizationInput"),
      ...deleteResource("Delete an organization and its dependent records"),
    },
    "/users": {
      ...readCollection("List users; password hashes are never returned"),
      ...createResource("Create a user", "UserInput"),
    },
    "/users/{id}": {
      ...readResource("Get a user"),
      ...updateResource("Update a user's name, email, or password", "UserUpdate"),
      ...deleteResource("Delete a user and their memberships"),
    },
    "/members": {
      ...readCollection("List memberships", [
        organizationFilter,
        { name: "user_id", in: "query", schema: { type: "string", format: "uuid" } },
      ]),
      ...createResource("Add a user to an organization", "MemberInput"),
    },
    "/members/{id}": {
      ...readResource("Get a membership"),
      ...updateResource("Change a membership role", "MemberUpdate"),
      ...deleteResource("Remove a membership"),
    },
    "/projects": {
      ...readCollection("List projects", [organizationFilter]),
      ...createResource("Create a project", "ProjectInput"),
    },
    "/projects/{id}": {
      ...readResource("Get a project and its related policy and routing rules"),
      ...updateResource("Update a project", "ProjectUpdate"),
      ...deleteResource("Delete a project and its dependent records"),
    },
    "/products": {
      ...readCollection("List projects (compatibility alias)", [organizationFilter]),
      ...createResource("Create a project (compatibility alias)", "ProjectInput"),
    },
    "/products/{id}": {
      ...readResource("Get a project (compatibility alias)"),
      ...updateResource("Update a project (compatibility alias)", "ProjectUpdate"),
      ...deleteResource("Delete a project (compatibility alias)"),
    },
    "/providers": {
      ...readCollection("List providers; encrypted provider credentials are not returned"),
      ...createResource("Create a provider", "ProviderInput"),
    },
    "/providers/{id}": {
      ...readResource("Get a provider and its models"),
      ...updateResource("Update a provider", "ProviderUpdate"),
      ...deleteResource("Delete a provider"),
    },
    "/models": {
      ...readCollection("List models", [
        { name: "provider_id", in: "query", schema: { type: "string", format: "uuid" } },
      ]),
      ...createResource("Create a model", "ModelInput"),
    },
    "/models/{id}": {
      ...readResource("Get a model and its aliases and routing rules"),
      ...updateResource("Update a model", "ModelUpdate"),
      ...deleteResource("Delete a model"),
    },
    "/provider-models": {
      ...readCollection("List model aliases", [
        { name: "alias", in: "query", schema: { type: "string" } },
        { name: "model_id", in: "query", schema: { type: "string", format: "uuid" } },
      ]),
      ...createResource("Create a model alias", "ProviderModelInput"),
    },
    "/provider-models/{id}": {
      ...readResource("Get a model alias"),
      ...updateResource("Update a model alias", "ProviderModelUpdate"),
      ...deleteResource("Delete a model alias"),
    },
    "/routing-rules": {
      ...readCollection("List routing rules", [organizationFilter, projectFilter]),
      ...createResource("Create a project routing rule", "RoutingRuleInput"),
    },
    "/routing-rules/{id}": {
      ...readResource("Get a routing rule and its related models"),
      ...updateResource("Update a routing rule", "RoutingRuleUpdate"),
      ...deleteResource("Delete a routing rule"),
    },
    "/api-keys": {
      ...readCollection("List API keys; key hashes and secret values are not returned", [
        organizationFilter,
        projectFilter,
      ]),
      ...createResource("Create an API key; the plaintext key is returned once", "ApiKeyInput"),
    },
    "/api-keys/{id}": {
      ...readResource("Get API key metadata"),
      ...updateResource("Update API key metadata or status", "ApiKeyUpdate"),
      ...deleteResource("Revoke an API key"),
    },
    "/guardrail-policies": {
      ...readCollection("List policies and their rules", [organizationFilter, projectFilter]),
      ...createResource("Create a policy with optional nested rules", "GuardrailPolicyInput"),
    },
    "/guardrail-policies/{id}": {
      ...readResource("Get a policy with its organization, project, rules, and events"),
      ...updateResource("Update a policy", "GuardrailPolicyUpdate"),
      ...deleteResource("Delete a policy and its dependent rules and events"),
    },
    "/guardrail-detection-rules": {
      get: {
        summary: "List detection rules for a policy",
        parameters: [policyFilter],
        responses: successResponse,
      },
      post: {
        summary: "Run the policy's enabled detection rules against a prompt",
        parameters: [policyFilter],
        requestBody: requestBody("SafetyCheckInput"),
        responses: successResponse,
      },
    },
    "/guardrail-detection-rules/rules": {
      ...createResource("Create a detection rule", "DetectionRuleInput"),
    },
    "/guardrail-detection-rules/rules/{id}": {
      ...updateResource("Update a detection rule", "DetectionRuleUpdate"),
      ...deleteResource("Delete a detection rule"),
    },
    "/guardrail-transformation-rules": {
      ...readCollection("List transformation rules", [policyFilter]),
      ...createResource("Create a transformation rule", "TransformationRuleInput"),
    },
    "/guardrail-transformation-rules/{id}": {
      ...readResource("Get a transformation rule"),
      ...updateResource("Update a transformation rule", "TransformationRuleUpdate"),
      ...deleteResource("Delete a transformation rule"),
    },
    "/guardrail-events": {
      ...readCollection("List guardrail events", [
        { name: "request_id", in: "query", schema: { type: "string", format: "uuid" } },
        policyFilter,
        { name: "action", in: "query", schema: { type: "string", enum: ["allow", "block", "redact", "flag"] } },
      ]),
      ...createResource("Record a guardrail event", "GuardrailEventInput"),
    },
    "/guardrail-events/{id}": readResource("Get a guardrail event"),
    "/usage-logs": {
      ...readCollection("List usage logs (maximum 500)", [
        organizationFilter,
        projectFilter,
        { name: "api_key_id", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "model_id", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "provider_id", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "request_id", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "status", in: "query", schema: { type: "string", enum: ["success", "error", "blocked", "rate_limited", "fallback_used"] } },
        { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 500, default: 100 } },
      ]),
      ...createResource("Record a usage log", "UsageLogInput"),
    },
    "/usage-logs/{id}": readResource("Get a usage log"),
    "/classify": {
      post: {
        summary: "Classify text using enabled detection rules for a policy",
        requestBody: requestBody("ClassifyInput"),
        responses: successResponse,
      },
    },
  },
  components: {
    schemas: {
      ResourceInput: {
        type: "object",
        description: "JSON request body for the operation.",
        additionalProperties: true,
      },
      OrganizationInput: {
        type: "object",
        properties: { name: { type: "string", example: "Acme" } },
        required: ["name"],
      },
      UserInput: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
          name: { type: "string" },
        },
        required: ["email", "password", "name"],
      },
      UserUpdate: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
          name: { type: "string" },
        },
        minProperties: 1,
      },
      MemberInput: {
        type: "object",
        properties: {
          organization_id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          role: { type: "string", enum: ["owner", "admin", "developer", "viewer"] },
        },
        required: ["organization_id", "user_id"],
      },
      MemberUpdate: {
        type: "object",
        properties: { role: { type: "string", enum: ["owner", "admin", "developer", "viewer"] } },
        required: ["role"],
      },
      ProjectInput: {
        type: "object",
        properties: {
          organization_id: { type: "string", format: "uuid" },
          name: { type: "string" },
          slug: { type: "string" },
        },
        required: ["organization_id", "name"],
      },
      ProjectUpdate: {
        type: "object",
        properties: { name: { type: "string" }, slug: { type: "string" } },
        minProperties: 1,
      },
      ProviderInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          base_url: { type: "string", format: "uri" },
          api_key_encrypted: { type: "string", description: "Encrypted credential value." },
          status: { type: "string", enum: ["active", "disabled", "degraded"] },
        },
        required: ["name", "base_url", "api_key_encrypted"],
      },
      ProviderUpdate: {
        type: "object",
        properties: {
          name: { type: "string" },
          base_url: { type: "string", format: "uri" },
          api_key_encrypted: { type: "string" },
          status: { type: "string", enum: ["active", "disabled", "degraded"] },
        },
        minProperties: 1,
      },
      ModelInput: {
        type: "object",
        properties: {
          provider_id: { type: "string", format: "uuid" },
          name: { type: "string" },
          model_identifier: { type: "string" },
          context_window: { type: "integer", minimum: 1 },
          input_cost_per_1m: { type: "number", minimum: 0 },
          output_cost_per_1m: { type: "number", minimum: 0 },
          capabilities: { type: "object", additionalProperties: true },
          status: { type: "string", enum: ["active", "deprecated", "disabled"] },
        },
        required: ["provider_id", "name", "model_identifier", "context_window", "input_cost_per_1m", "output_cost_per_1m"],
      },
      ModelUpdate: {
        type: "object",
        properties: {
          provider_id: { type: "string", format: "uuid" },
          name: { type: "string" },
          model_identifier: { type: "string" },
          context_window: { type: "integer", minimum: 1 },
          input_cost_per_1m: { type: "number", minimum: 0 },
          output_cost_per_1m: { type: "number", minimum: 0 },
          capabilities: { type: "object", additionalProperties: true },
          status: { type: "string", enum: ["active", "deprecated", "disabled"] },
        },
        minProperties: 1,
      },
      ProviderModelInput: {
        type: "object",
        properties: {
          alias: { type: "string" },
          model_id: { type: "string", format: "uuid" },
          priority: { type: "integer", default: 0 },
          is_fallback: { type: "boolean", default: false },
        },
        required: ["alias", "model_id"],
      },
      ProviderModelUpdate: {
        type: "object",
        properties: {
          alias: { type: "string" },
          model_id: { type: "string", format: "uuid" },
          priority: { type: "integer" },
          is_fallback: { type: "boolean" },
        },
        minProperties: 1,
      },
      RoutingRuleInput: {
        type: "object",
        properties: {
          organization_id: { type: "string", format: "uuid" },
          project_id: { type: "string", format: "uuid" },
          name: { type: "string" },
          conditions: { type: "object", additionalProperties: true },
          target_model_id: { type: "string", format: "uuid", nullable: true },
          fallback_model_id: { type: "string", format: "uuid", nullable: true },
          priority: { type: "integer", default: 0 },
          enabled: { type: "boolean", default: true },
        },
        required: ["organization_id", "project_id", "name"],
      },
      RoutingRuleUpdate: {
        type: "object",
        properties: {
          organization_id: { type: "string", format: "uuid" },
          project_id: { type: "string", format: "uuid" },
          name: { type: "string" },
          conditions: { type: "object", additionalProperties: true },
          target_model_id: { type: "string", format: "uuid", nullable: true },
          fallback_model_id: { type: "string", format: "uuid", nullable: true },
          priority: { type: "integer" },
          enabled: { type: "boolean" },
        },
        minProperties: 1,
      },
      ApiKeyInput: {
        type: "object",
        properties: {
          organization_id: { type: "string", format: "uuid" },
          project_id: { type: "string", format: "uuid", nullable: true },
          name: { type: "string", nullable: true },
          permissions: { type: "object", additionalProperties: true },
          rate_limit_per_min: { type: "integer", minimum: 1, default: 60 },
          expires_at: { type: "string", format: "date-time", nullable: true },
        },
        required: ["organization_id"],
      },
      ApiKeyUpdate: {
        type: "object",
        properties: {
          name: { type: "string", nullable: true },
          permissions: { type: "object", additionalProperties: true },
          rate_limit_per_min: { type: "integer", minimum: 1 },
          status: { type: "string", enum: ["active", "revoked", "expired"] },
          expires_at: { type: "string", format: "date-time", nullable: true },
        },
        minProperties: 1,
      },
      RuleInput: {
        type: "object",
        properties: {
          type: { type: "string" },
          name: { type: "string" },
          action: { type: "string" },
          enabled: { type: "boolean" },
          config: { type: "object", additionalProperties: true },
          priority: { type: "integer", nullable: true },
        },
        required: ["type", "name", "action"],
      },
      DetectionRuleInput: {
        allOf: [
          { $ref: "#/components/schemas/RuleInput" },
          {
            type: "object",
            properties: { policy_id: { type: "string", format: "uuid" }, threshold: { type: "number", nullable: true } },
            required: ["policy_id"],
          },
        ],
      },
      DetectionRuleUpdate: {
        type: "object",
        properties: {
          policy_id: { type: "string", format: "uuid" },
          type: { type: "string" },
          name: { type: "string" },
          action: { type: "string" },
          enabled: { type: "boolean" },
          threshold: { type: "number", nullable: true },
          config: { type: "object", additionalProperties: true },
          priority: { type: "integer", nullable: true },
        },
        minProperties: 1,
      },
      TransformationRuleInput: {
        allOf: [
          { $ref: "#/components/schemas/RuleInput" },
          { type: "object", properties: { policy_id: { type: "string", format: "uuid" } }, required: ["policy_id"] },
        ],
      },
      TransformationRuleUpdate: {
        type: "object",
        properties: {
          policy_id: { type: "string", format: "uuid" },
          type: { type: "string" },
          name: { type: "string" },
          action: { type: "string" },
          enabled: { type: "boolean" },
          config: { type: "object", additionalProperties: true },
          priority: { type: "integer", nullable: true },
        },
        minProperties: 1,
      },
      GuardrailPolicyInput: {
        type: "object",
        properties: {
          organization_id: { type: "string", format: "uuid" },
          project_id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          enabled: { type: "boolean" },
          guardrail_detection_rules: {
            type: "array",
            items: { $ref: "#/components/schemas/RuleInput" },
          },
          guardrail_transformation_rules: {
            type: "array",
            items: { $ref: "#/components/schemas/RuleInput" },
          },
        },
        required: ["organization_id", "project_id", "name"],
      },
      GuardrailPolicyUpdate: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string", nullable: true },
          enabled: { type: "boolean" },
        },
        minProperties: 1,
      },
      GuardrailEventInput: {
        type: "object",
        properties: {
          request_id: { type: "string", format: "uuid" },
          guardrail_policy_id: { type: "string", format: "uuid", nullable: true },
          stage: { type: "string" },
          rule_triggered: { type: "string" },
          action: { type: "string", enum: ["allow", "block", "redact", "flag"] },
          detail: { type: "object", additionalProperties: true },
        },
        required: ["request_id", "stage", "rule_triggered", "action"],
      },
      UsageLogInput: {
        type: "object",
        properties: {
          request_id: { type: "string", format: "uuid" },
          organization_id: { type: "string", format: "uuid" },
          project_id: { type: "string", format: "uuid", nullable: true },
          api_key_id: { type: "string", format: "uuid", nullable: true },
          model_id: { type: "string", format: "uuid", nullable: true },
          provider_id: { type: "string", format: "uuid", nullable: true },
          requested_alias: { type: "string", nullable: true },
          input_tokens: { type: "integer", minimum: 0, default: 0 },
          output_tokens: { type: "integer", minimum: 0, default: 0 },
          latency_ms: { type: "integer", minimum: 0, nullable: true },
          cost: { type: "number", minimum: 0, default: 0 },
          status: { type: "string", enum: ["success", "error", "blocked", "rate_limited", "fallback_used"] },
          error_message: { type: "string", nullable: true },
        },
        required: ["request_id", "organization_id", "status"],
      },
      ClassifyInput: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to classify." },
          policy_id: { type: "string", format: "uuid" },
        },
        required: ["text", "policy_id"],
      },
      SafetyCheckInput: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Prompt to send to the safety service." },
        },
        required: ["prompt"],
      },
    },
  },
} as const;

const pathTags: Record<string, string> = {
  "/organizations": "Organizations",
  "/users": "Users",
  "/members": "Members",
  "/projects": "Projects",
  "/products": "Projects",
  "/providers": "Providers",
  "/models": "Models",
  "/provider-models": "Provider model aliases",
  "/routing-rules": "Routing rules",
  "/api-keys": "API keys",
  "/guardrail-policies": "Guardrail policies",
  "/guardrail-detection-rules": "Detection rules",
  "/guardrail-transformation-rules": "Transformation rules",
  "/guardrail-events": "Guardrail events",
  "/usage-logs": "Usage logs",
  "/classify": "Classification",
};

const openApiSpec = {
  ...rawOpenApiSpec,
  paths: Object.fromEntries(
    Object.entries(rawOpenApiSpec.paths).map(([path, operations]) => {
      const tag =
        Object.entries(pathTags).find(([prefix]) => path.startsWith(prefix))?.[1] ??
        "Other";
      return [
        path,
        Object.fromEntries(
          Object.entries(operations).map(([method, operation]) => [
            method,
            { ...operation, tags: [tag] },
          ]),
        ),
      ];
    }),
  ),
};

export default openApiSpec;
