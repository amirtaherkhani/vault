import { plainToInstance } from 'class-transformer';
import { RoleEnum } from '../../roles/roles.enum';
import { RoleGroupsDict } from '../types/role-groups-const.type';
/**
 * For single object transformation using role-based or named group serialization
 */
export function GroupPlainToInstance<T, V>(
  cls: new () => T,
  data: V,
  roles: Array<RoleEnum | string> = [],
): T {
  const groups = roles.map((role) => {
    if (typeof role === 'string') {
      return role;
    }
    const group = RoleGroupsDict[role];
    if (!group) {
      throw new Error(`Unknown RoleEnum value: ${role}`);
    }
    return group;
  });
  return plainToInstance(cls, data, { groups });
}

/**
 * For array of objects transformation using role-based or named group serialization
 */
export function GroupPlainToInstances<T, V>(
  cls: new () => T,
  data: V[],
  roles: Array<RoleEnum | string> = [],
): T[] {
  const groups = roles.map((role) => {
    if (typeof role === 'string') {
      return role;
    }
    const group = RoleGroupsDict[role];
    if (!group) {
      throw new Error(`Unknown RoleEnum value: ${role}`);
    }
    return group;
  });
  return plainToInstance(cls, data, { groups });
}
