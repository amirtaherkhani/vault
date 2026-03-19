# Global Shared Variables

A tiny set of read-only globals lives on `globalThis` so bootstrap code and out-of-DI utilities can read app metadata and service health without wiring Nest providers. Keep this list short and prefer injected services in normal flow.

## Current globals

- `APP`: Frozen `AppConfig` resolved at startup (name, version, env, host/port, docs URL, etc.). Source: `src/common/globals/runtime/app-info.global.ts`.
- `SERVICES_STATUS`: Accessor with `getAll()` that returns every registered `BaseToggleableService` snapshot. Source: `src/common/globals/runtime/services-status.global.ts`.

## How it works

- `app-info.global.ts` calls the existing `app.config.ts` factory, freezes the result, warns in non-production if you read an unknown property, assigns it to `globalThis.APP`, and logs `name@version:env`.
- `services-status.global.ts` exposes `globalThis.SERVICES_STATUS`, a light wrapper around `BaseToggleableService.getToggleableServices()`.
- Types live in `src/common/globals/types/app-info.type.ts`, making `APP` available to TypeScript everywhere as `Readonly<AppConfig>`.
- `src/main.ts` imports both runtime files first; any other entry point (CLI script, worker) must import the runtime file once to populate the globals.

## Using `APP` inside Nest

Preferred: inject the helper service to stay DI-friendly and testable.

```ts
import { AppInfoService } from 'src/common/globals/services/app-info.service';

@Injectable()
export class ExampleService {
  constructor(private readonly appInfo: AppInfoService) {}

  banner(): string {
    return `${this.appInfo.name} v${this.appInfo.version}`;
  }
}
```

Fallback (only when DI is unavailable, e.g., bootstrap code, logger plugins, migration scripts):

```ts
const docsUrl = `${APP.backendDomain}/docs`; // read-only; APP is frozen
```

## Using `SERVICES_STATUS`

- Extend `BaseToggleableService` so your service auto-registers in the global registry.

```ts
@Injectable()
export class PricingService extends BaseToggleableService {
  constructor() {
    super(PricingService.name, true, {
      displayName: 'Pricing',
      tags: ['core', 'external'],
    });
  }

  async quote(...) {
    this.checkIfEnabled();
    // ...
  }
}
```

- Anywhere (controller, health endpoint, dashboard) you can read the registry:

```ts
const snapshot = SERVICES_STATUS.getAll(); // ToggleableServiceSnapshot[]
```

- Use `setEnabled()` inside your service to flip availability; `checkIfEnabled()` guards operations and throws `ServiceUnavailableException` when disabled.

## When to use vs avoid

- Use when you need app metadata before Nest DI is ready (Swagger builder in `src/main.ts`, early logging, standalone scripts) or to surface toggleable-service state (`HomeService.servicesInfo`).
- Prefer `ConfigService`/`AppInfoService` inside standard providers for clearer dependencies and easier testing.
- Do not mutate `APP`; it is frozen. Avoid storing request-scoped or user data in globals—keep them for static app-level facts.
- In tests, import the runtime file once or stub `globalThis.APP`/`globalThis.SERVICES_STATUS` before assertions.

## Adding another global (rare)

1) First ask if a provider or `ConfigService` is enough—globals should stay minimal.
2) Define a type under `src/common/globals/types`.
3) Add a runtime initializer under `src/common/globals/runtime` that builds the value, freezes it, and assigns to `globalThis`.
4) Optionally wrap it in a Nest service under `src/common/globals/services` for DI-friendly access.
5) Import the initializer in every entry point that needs it (`src/main.ts`, workers, scripts).

### Quick template

```ts
// src/common/globals/types/foo.type.ts
export type FooGlobal = { bar: string };
declare global {
  // eslint-disable-next-line no-var
  var FOO: Readonly<FooGlobal>;
}
export {};

// src/common/globals/runtime/foo.global.ts
import { Logger } from '@nestjs/common';
import { FooGlobal } from '../types/foo.type';
const logger = new Logger('FooGlobals');

const value: FooGlobal = Object.freeze({ bar: 'baz' });
globalThis.FOO = value;
logger.log('Initialized FOO global');
export {};

// src/main.ts (top of file)
import './common/globals/runtime/foo.global';
```

### Common pitfalls

- Forgetting to import the runtime initializer in an entry point leaves the global undefined.
- Do not mutate globals after freezing; prefer adding fields to the source config instead.
- Keep names all-caps to avoid collisions and signal intent.
