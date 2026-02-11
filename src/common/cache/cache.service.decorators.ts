import { CacheEvictOptions, CacheOptions } from './cache.types';
import { CacheService } from './cache.service';

type CacheAware = {
  cacheService?: CacheService;
  cache?: CacheService;
};

function resolveCache(instance: CacheAware): CacheService | undefined {
  return instance.cacheService ?? instance.cache;
}

export const CacheableMethod = (options: CacheOptions = {}) => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const original = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      const cacheService = resolveCache(this as CacheAware);
      if (!cacheService) {
        return original.apply(this, args);
      }
      const context = {
        className: (target as any)?.constructor?.name,
        handlerName: String(propertyKey),
      };
      const merged: CacheOptions = {
        keyStrategy: 'args',
        ...options,
      };
      const result = await cacheService.cached(merged, context, args, () =>
        original.apply(this, args),
      );
      return result.value;
    };
    return descriptor;
  };
};

export const CacheEvictMethod = (options: CacheEvictOptions = {}) => {
  return (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const original = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      const cacheService = resolveCache(this as CacheAware);
      if (!cacheService) {
        return original.apply(this, args);
      }
      if (options.beforeInvocation) {
        await cacheService.evict(options);
      }
      const result = await original.apply(this, args);
      if (!options.beforeInvocation) {
        await cacheService.evict(options);
      }
      return result;
    };
    return descriptor;
  };
};
