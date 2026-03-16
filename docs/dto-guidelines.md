# DTO Guidelines

This note is a single place for how we design and use DTOs across the app (not provider‑specific).

## Roles and Categories

- **Provider transport DTOs** (`src/providers/<provider>/dto/*-base.request/response.dto.ts`, `<provider>.webhook.dto.ts`): validation + Swagger only; no `@Exclude`/`@Expose`/role groups. They are used by base/provider services and workflows, never returned by controllers.
- **Controller‑facing DTOs** (`<feature>/dto/*.dto.ts`): API contracts for app clients. Use `@Exclude` + `@Expose(RoleGroups([...]))` only when you need role‑based serialization. Use `GroupPlainToInstance(s)` in services that return them.
- **Internal/request DTOs for “me/admin” variants**: prefer a base DTO plus `extends` for admin/me differences to avoid duplication.
- **Domain models vs DTOs**: services should return domain objects (mapped from persistence entities) when the data has a local model; use DTOs for transport-only shapes or when no domain exists (for example, provider base responses).

## Decorators and Serialization

- Always document fields with `@ApiProperty`/`@ApiPropertyOptional` and validate with `class-validator`.
- Use `@Exclude`/`@Expose` only on controller responses that need serialization control. Do not add them to provider transport DTOs.
- Apply `RoleGroups` on `@Expose` only for fields that should differ by role (admin/user). Controllers should set `@SerializeOptions(SerializeGroups([...]))`.
- Keep “me” endpoints guarded (e.g., `StrigaUserExistsGuard`) and rely on `req.user` inside services instead of passing user ids manually.

## Usage Rules

- Controllers accept request DTOs and return DTOs or domain models; they should not return persistence entities or raw provider payloads.
- Services that call providers use the base request/response DTOs. Map provider responses to domain/DTOs before returning to controllers.
- Workflows orchestrate; they do not add serialization or controller formatting.
- When mapping persistence → domain → DTO, keep mapper logic in mapper classes, not in controllers.
- If a response DTO has no domain model (e.g., base provider envelopes), add a mapper/helper to normalize shapes before controllers use them.

## Naming and Placement

- Suffix classes with `Dto`. Keep transport DTOs under `src/providers/<provider>/dto/`; keep app/controller DTOs under each module’s `dto/` folder.
- Use clear method names that indicate source: `find*FromProvider`, `create*InProvider`, `*ForMe`, etc. Avoid ambiguous `get*`.
- Reuse DTOs where possible; do not create many tiny variants for the same payload.

## Common Pitfalls

- Do not leak provider transport DTOs or raw provider responses to clients.
- Do not add `@Expose`/role groups to transport‑only DTOs.
- Do not map local `account.accountId` to provider sub-account ids; keep wallet/account mapping consistent with domain docs.
- When returning lists, normalize pagination/metadata in services instead of controllers.

## Naming, Files, and Directories

- Suffix everything with `Dto` (e.g., `CreateUserDto`, `StrigaGetWalletRequestDto`).
- File names are kebab-case matching the main exported DTO: `create-user.dto.ts`, `striga-base.request.dto.ts`.
- Keep provider transport DTOs in `src/providers/<provider>/dto/`; keep app/controller DTOs inside each module’s `dto/` folder.
- Group request/response pairs in the same file only when they are tightly coupled (e.g., provider base request/response). Otherwise, one primary DTO per file keeps diffs small.
- Admin/me variants: base file + small subclasses in the same file when they share most fields.
- Avoid `index.ts` barrel files for DTOs; import DTOs directly from their file to keep references explicit.

## Quick Checklist When Adding a New DTO

- Pick the right category (provider transport vs controller contract).
- Add validation + Swagger decorators to every field.
- Only add `@Exclude`/`@Expose`/`RoleGroups` if the DTO is sent to clients and needs role filtering.
- Decide whether the service should return a domain model (preferred when persistence-backed) or a DTO; add a mapper if needed.
- Reuse base DTO + inheritance for admin/me differences instead of copy/paste.
