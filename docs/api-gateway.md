# API Gateway

## Scope

`src/common/api-gateway` is the shared transport layer for external providers.
It standardizes:

- endpoint registration
- request construction (`param`, `query`, `body`, `headers`)
- retry/timeout behavior
- runtime base URL/header updates
- response normalization into app envelope

This document is global and provider-agnostic. Use it when building any provider module.

## Core Architecture

### Core files

- `src/common/api-gateway/api-gateway-config.ts`
Role: base class to register endpoints (`addEndpoint`).

- `src/common/api-gateway/api-client.factory.ts`
Role: generates endpoint functions and executes HTTP calls with retry + timeout.

- `src/common/api-gateway/api-gateway.service.ts`
Role: runtime registry of configs/clients, supports `getClient`, `updateBaseUrl`, `updateHeaders`.

- `src/common/api-gateway/api-gateway.module.ts`
Role: dynamic module that receives configs and exposes `API_GATEWAY_<NAME>` tokens.

- `src/common/api-gateway/types/api-gateway.type.ts`
Role: canonical gateway input/output contracts (`RequestInput`, retry options, endpoint definitions).

- `src/common/api-gateway/response/*`
Role: optional provider response adapter system (`@ResponseModel`, registry, adapter interface).

- `src/utils/interceptors/message-response.interceptor.ts`
Role: final HTTP envelope normalization for all controller responses.

### Runtime flow

1. Provider config class extends `ApiGatewayConfig` and registers endpoints.
2. `ApiGatewayModule.register([...configs])` is called in `src/providers/providers.module.ts`.
3. Dynamic tokens are created (`API_GATEWAY_CMC`, `API_GATEWAY_STRIGA`, ...).
4. Provider service injects token and/or `ApiGatewayService`.
5. Provider service optionally updates base URL and headers in `onModuleInit`.
6. Service methods call generated endpoint functions using `RequestInput`.
7. Response is mapped in service/adapter, then normalized by interceptor for HTTP output.

## Request Contract

All generated endpoint functions accept this shape:

```ts
type RequestInput = {
  param?: Record<string, string | number | boolean>;
  query?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
};
```

Rules:

- `param` replaces `/path/{id}` placeholders.
- `query` becomes query string.
- `body` is sent for `POST | PUT | PATCH`.
- per-request headers merge with provider/global headers.
- endpoint response default envelope from gateway factory:
  - `{ statusCode, data, headers }`

## Service Layer Patterns

Use one of these patterns based on provider complexity.

### Pattern A: Single service

Use when provider is simple and all integration logic fits in one class.

Responsibilities:

- initialize provider client
- configure headers/base URL
- call gateway endpoints
- map payload to controller DTOs

Typical structure:

- `provider.service.ts`
- `provider.controller.ts`
- `provider.module.ts`
- `config/provider-endpoints.config.ts`
- `dto/*.dto.ts`

### Pattern B: Main service + sub-services + workflow services

Use when provider has many domains (users/wallets/cards/transactions/webhooks/workflows).

Responsibilities by layer:

- main service:
  - service enable/ready checks
  - authentication/signing transport logic (for provider-specific signatures)
  - low-level generic request function (for example `signedRequest`)

- base sub-service:
  - thin wrapper over main service request function
  - shared helper methods for child services

- sub-services:
  - endpoint-specific provider methods only
  - local persistence sync related to that domain
  - no controller-only formatting logic

- workflow service:
  - orchestration only
  - calls sub-services and local services
  - avoids duplicating provider transport logic

Important principle:

- emit internal events at true state mutation point (create/update/upsert service), not from orchestration if it can cause duplicate/unclear emission paths.

## DTO Architecture

DTOs must be separated by purpose, not by randomness.

### 1) Provider transport DTOs (internal integration contracts)

Location:

- `src/providers/<provider>/dto`

Files:

- `<provider>-base.request.dto.ts`
Purpose: request DTOs used to call provider APIs.

- `<provider>-base.response.dto.ts`
Purpose: provider response contracts and base response envelope used by provider service internals.

- `<provider>.webhook.dto.ts`
Purpose: webhook payload contracts parsed from provider callbacks.

Usage rule:

- these DTOs are mainly for provider services/workflows/internal events.
- if a DTO is only used internally (not returned by controller endpoints), do not use `@Expose()` / `@Exclude()` and do not use role-group serialization decorators.
- internal provider/base services (for example `src/providers/striga/services/striga-base.service.ts`) should keep transport DTOs as plain validation/swagger contracts.
- do not create many small duplicate DTOs when one base DTO can be reused.

### 2) Controller-facing DTOs (app API contracts)

Location:

- feature-specific module `dto/` folders (for example `striga-users/dto`, `cmc/dto`).

Usage rule:

- methods used directly by controllers should return explicit DTO/domain instances.
- apply `@Exclude()` + `@Expose(...)` and role groups only when response serialization/group filtering is required for client-facing endpoints.
- use `GroupPlainToInstance` / `GroupPlainToInstances` in service methods used directly by controllers.

### 3) DTO inheritance

When admin/me variants differ slightly:

- create a base DTO
- extend it for variant DTOs
- avoid copy-paste duplicate DTO classes

## File and Naming Conventions

Follow project naming rules from `docs/coding-princeples.md` and keep provider naming explicit.

### Gateway and config files

- `config/<provider>-endpoints.config.ts`
- `config/<provider>.config.ts`
- `config/<provider>-config.type.ts`
- `types/<provider>-base.type.ts`
- `types/<provider>-const.type.ts`
- `types/<provider>-event.type.ts`
- `types/<provider>-webhook.type.ts`

### Service naming

Use names that make source/scope explicit.

- `find*FromProvider`
Direct reads from external provider through api-gateway.

- `create*InProvider`, `update*InProvider`, `verify*InProvider`, `resend*InProvider`
Direct write/command calls to provider.

- `*ForMe`
Current authenticated user flow.

- local DB methods
Use explicit local names (`findById`, `findByEmail`, `updateAddress`, `upsert...`).

Rules:

- prefer `find*` over `get*` for reads.
- keep low-level transport methods (`signedRequest`, etc.) internal.
- avoid generic method names that hide data source.

### Endpoint name constants

Keep endpoint names centralized and typed in one place (key-mirror/object pattern).
Service methods should reference endpoint names from constants, not hardcoded strings.

## Response Normalization Strategy

There are two supported strategies.

### Strategy 1: Provider adapter + `@ResponseModel`

Use when provider response shape needs central normalization for controller outputs.

Steps:

1. Implement `ProviderResponseAdapter`.
2. Register adapter in module `onModuleInit` via `ProviderResponseRegistry`.
3. Add `@ResponseModel('<PROVIDER>')` on controller.

### Strategy 2: Service mapper output

Use when provider service already maps gateway envelope to provider base response DTO.

Rules:

- mapping logic belongs to mapper/service layer, not controller.
- do not hardcode envelope in controller.
- keep controller thin and return service result.

## Recommended Provider Directory Structure

```txt
src/providers/<provider>/
  config/
    <provider>-endpoints.config.ts
    <provider>.config.ts
    <provider>-config.type.ts
  dto/
    <provider>-base.request.dto.ts
    <provider>-base.response.dto.ts
    <provider>.webhook.dto.ts
  types/
    <provider>-base.type.ts
    <provider>-const.type.ts
    <provider>-event.type.ts
    <provider>-webhook.type.ts
  services/
    <provider>-base.service.ts
    <provider>-<domain>.service.ts
    <provider>-<domain>-workflow.service.ts
  events/
    <provider>-<domain>.event.ts
    <provider>-<domain>.event.handler.ts
  infrastructure/
    persistence/
      relational/
        mappers/
          <provider>.mapper.ts
  <provider>.service.ts
  <provider>.controller.ts
  <provider>.module.ts
```

## Implementation Checklist (New Provider)

1. Add provider config + endpoint config class.
2. Register config in `src/providers/providers.module.ts`.
3. Create provider module and service(s).
4. Inject `API_GATEWAY_<NAME>` token and `ApiGatewayService` as needed.
5. Implement init flow (`updateBaseUrl`, `updateHeaders`, health check/ping).
6. Add internal provider transport methods (`find*FromProvider`, `create*InProvider`, ...).
7. Add DTO mapping for controller-facing methods.
8. Add controller endpoints (thin controllers only).
9. Add response adapter only if provider-level normalization is needed.
10. Add workflows/events where orchestration or async sync is required.

## Anti-Patterns To Avoid

- provider HTTP logic in controllers
- business orchestration inside controllers
- duplicated request/response DTO classes with same shape
- multiple methods that do same transport job with different names
- hardcoded response envelope scattered in controllers/services
- event emission from multiple layers for one mutation path
- adding helper wrappers that only rename one-line logic without value

## Minimal Example

### Endpoint config

```ts
export class ExampleApiConfig extends ApiGatewayConfig {
  constructor() {
    super('https://example.com', { Accept: 'application/json' });
    this.name = 'EXAMPLE';

    this.addEndpoint('findUserById', HttpMethod.GET, '/users/{userId}', {
      timeoutMs: 5000,
    });
  }
}
```

### Provider service call

```ts
async findUserByIdFromProvider(userId: string) {
  return this.apiClient.findUserById({
    param: { userId },
  });
}
```

### Main + sub-service call pattern

```ts
// main service
async signedRequest(endpointName: ExampleEndpointName, input: RequestInput = {}) {
  // auth/signature + call api-gateway client
}

// sub-service
async findUserByIdFromProvider(userId: string) {
  return this.signedRequest(EXAMPLE_ENDPOINT_NAME.findUserById, {
    param: { userId },
  });
}
```
