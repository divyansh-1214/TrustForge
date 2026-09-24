# AI Gateway — Schema ER Diagram

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ MEMBERS : has
    USERS ||--o{ MEMBERS : has
    ORGANIZATIONS ||--o{ PROJECTS : has
    ORGANIZATIONS ||--o{ API_KEYS : has
    PROJECTS ||--o{ API_KEYS : scopes

    PROVIDERS ||--o{ MODELS : offers
    MODELS ||--o{ PROVIDER_MODELS : "aliased as"

    ORGANIZATIONS ||--o{ ROUTING_RULES : defines
    PROJECTS ||--o{ ROUTING_RULES : scopes
    MODELS ||--o{ ROUTING_RULES : "target/fallback"

    ORGANIZATIONS ||--o{ GUARDRAIL_POLICIES : defines
    PROJECTS ||--o{ GUARDRAIL_POLICIES : scopes
    GUARDRAIL_POLICIES ||--o{ GUARDRAIL_EVENTS : triggers

    ORGANIZATIONS ||--o{ USAGE_LOGS : accrues
    PROJECTS ||--o{ USAGE_LOGS : accrues
    API_KEYS ||--o{ USAGE_LOGS : used_in
    MODELS ||--o{ USAGE_LOGS : consumed_via
    PROVIDERS ||--o{ USAGE_LOGS : billed_via

    ORGANIZATIONS {
        uuid id PK
        text name
        text slug
    }
    USERS {
        uuid id PK
        text email
        text password_hash
        text name
    }
    MEMBERS {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        enum role
    }
    PROJECTS {
        uuid id PK
        uuid organization_id FK
        text name
        text slug
    }
    PROVIDERS {
        uuid id PK
        text name
        text base_url
        text api_key_encrypted
        enum status
    }
    MODELS {
        uuid id PK
        uuid provider_id FK
        text name
        text model_identifier
        int context_window
        numeric input_cost_per_1m
        numeric output_cost_per_1m
        jsonb capabilities
        enum status
    }
    PROVIDER_MODELS {
        uuid id PK
        text alias
        uuid model_id FK
        int priority
        bool is_fallback
    }
    ROUTING_RULES {
        uuid id PK
        uuid organization_id FK
        uuid project_id FK
        text name
        jsonb conditions
        uuid target_model_id FK
        uuid fallback_model_id FK
        bool enabled
    }
    GUARDRAIL_POLICIES {
        uuid id PK
        uuid organization_id FK
        uuid project_id FK
        text name
        jsonb rules
        bool enabled
    }
    GUARDRAIL_EVENTS {
        uuid id PK
        uuid request_id
        uuid guardrail_policy_id FK
        text stage
        text rule_triggered
        enum action
    }
    API_KEYS {
        uuid id PK
        uuid organization_id FK
        uuid project_id FK
        text key_hash
        text key_prefix
        int rate_limit_per_min
        enum status
    }
    USAGE_LOGS {
        uuid id PK
        uuid request_id
        uuid organization_id FK
        uuid project_id FK
        uuid api_key_id FK
        uuid model_id FK
        uuid provider_id FK
        int input_tokens
        int output_tokens
        numeric cost
        enum status
    }
```


``` 
https://api.yourapp.com/v1
│
├── /organizations
│
├── /organizations/{slug}
│   ├── /members
│   ├── /api-keys
│   ├── /usage
│   └── /models
│
├── /providers
│
├── /models
│
├── /routing-rules
│
├── /guardrail-policies
│
└── /usage-logs
```
