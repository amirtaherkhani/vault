import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { getEnumErrorMessage, isValidEnumValue } from '../helpers/enum.helper';
import { RoleGroupsDict } from '../types/role-groups-const.type';
import { RoleEnum } from '../../roles/roles.enum';

@Injectable()
export class ValidateEnumTransformer implements PipeTransform {
  constructor(
    private readonly enumType: object,
    private readonly fieldName: string,
  ) {}

  transform(value: any) {
    if (!isValidEnumValue(this.enumType, value)) {
      throw new BadRequestException(
        getEnumErrorMessage(this.enumType, this.fieldName),
      );
    }
    return value;
  }
}

export function SerializeGroups(groups: Array<RoleEnum | string>): {
  groups: string[];
} {
  const mapped = groups.map((group) => {
    if (typeof group === 'string') {
      return group;
    }
    const mappedGroup = RoleGroupsDict[group];
    if (!mappedGroup) {
      throw new Error(`Unknown RoleEnum value: ${group}`);
    }
    return mappedGroup;
  });

  return {
    groups: Array.from(new Set(mapped)),
  };
}

// Helper to get serialization groups from a list of roles
export function RoleGroups(roles: RoleEnum[]): { groups: string[] } {
  return SerializeGroups(roles);
}
