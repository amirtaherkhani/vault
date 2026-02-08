import { ServiceUnavailableException, Logger } from '@nestjs/common';

export type ToggleableServiceMeta = {
  id?: string;
  displayName?: string;
  configKey?: string;
  envKey?: string;
  description?: string;
  tags?: string[];
};

export type ToggleableServiceSnapshot = {
  id: string;
  name: string;
  displayName?: string;
  enabled: boolean;
  updatedAt: string;
  configKey?: string;
  envKey?: string;
  description?: string;
  tags?: string[];
};

type ToggleableRegistryEntry = {
  id: string;
  name: string;
  enabled: boolean;
  updatedAt: number;
  meta?: Omit<ToggleableServiceMeta, 'id'>;
};

/**
 * Base class for services that can be toggled enabled/disabled.
 */
export abstract class BaseToggleableService {
  private static readonly registry = new Map<string, ToggleableRegistryEntry>();

  protected readonly logger: Logger;
  private _isEnabled: boolean;
  private readonly registryId: string;

  constructor(
    serviceName: string,
    isEnabled: boolean,
    meta?: ToggleableServiceMeta,
  ) {
    this.logger = new Logger(serviceName);
    this._isEnabled = isEnabled;
    this.registryId = meta?.id ?? serviceName;
    BaseToggleableService.register({
      id: this.registryId,
      name: serviceName,
      enabled: isEnabled,
      updatedAt: Date.now(),
      meta: BaseToggleableService.normalizeMeta(meta),
    });

    this.logEnabledStatus();
  }

  static getToggleableServices(): ToggleableServiceSnapshot[] {
    return Array.from(BaseToggleableService.registry.values())
      .map((entry) => BaseToggleableService.toSnapshot(entry))
      .sort((a, b) =>
        (a.displayName ?? a.name).localeCompare(b.displayName ?? b.name),
      );
  }

  /**
   * Enable or disable the service at runtime.
   * Logs whenever the state actually changes.
   */
  setEnabled(enabled: boolean): void {
    const previous = this._isEnabled;
    this._isEnabled = enabled;

    if (previous !== enabled) {
      BaseToggleableService.update(this.registryId, enabled);
      this.logEnabledStatus();
    }
  }

  /** Returns the current enabled flag. */
  getEnabled(): boolean {
    return this._isEnabled;
  }

  /** Allow inheritors to access the live enabled flag as a property. */
  protected get isEnabled(): boolean {
    return this._isEnabled;
  }

  /**
   * Deprecated: Use checkIfEnabled() instead.
   */
  protected throwIfDisabled(): void {
    // Deprecated: Use checkIfEnabled() instead.
    if (!this._isEnabled) {
      throw new ServiceUnavailableException('Service is disabled internally.');
    }
  }

  /**
   * Checks if the service is enabled; if not, logs and throws an error.
   */
  protected checkIfEnabled(): void {
    if (!this._isEnabled) {
      this.logger.warn('Operation attempted but service is DISABLED.');
      throw new ServiceUnavailableException('Service is disabled.');
    }
  }

  /**
   * Logs whether the service is enabled or disabled.
   */
  protected logEnabledStatus(): void {
    if (this._isEnabled) {
      this.logger.log('Service is ENABLED.');
    } else {
      this.logger.warn('Service is DISABLED.');
    }
  }

  private static normalizeMeta(
    meta?: ToggleableServiceMeta,
  ): Omit<ToggleableServiceMeta, 'id'> | undefined {
    if (!meta) return undefined;
    const { id: _id, ...rest } = meta;
    return Object.keys(rest).length > 0 ? rest : undefined;
  }

  private static toSnapshot(
    entry: ToggleableRegistryEntry,
  ): ToggleableServiceSnapshot {
    return {
      id: entry.id,
      name: entry.name,
      enabled: entry.enabled,
      updatedAt: new Date(entry.updatedAt).toISOString(),
      ...(entry.meta ?? {}),
    };
  }

  private static register(entry: ToggleableRegistryEntry): void {
    BaseToggleableService.registry.set(entry.id, entry);
  }

  private static update(id: string, enabled: boolean): void {
    const existing = BaseToggleableService.registry.get(id);
    if (!existing) {
      BaseToggleableService.registry.set(id, {
        id,
        name: id,
        enabled,
        updatedAt: Date.now(),
      });
      return;
    }
    existing.enabled = enabled;
    existing.updatedAt = Date.now();
  }
}
