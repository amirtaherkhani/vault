import { Expose } from 'class-transformer';
import { RoleEnum } from '../../../roles/roles.enum';
import { RoleGroups } from '../../../utils/transformers/enum.transformer';

export class BaseResponse<T = any> {
  @Expose()
  statusCode: number;

  @Expose()
  data: T;

  @Expose(RoleGroups([RoleEnum.admin]))
  headers?: Record<string, any>;

  constructor(statusCode: number, data: T, headers?: Record<string, any>) {
    this.statusCode = statusCode;
    this.data = data;
    this.headers = headers;
  }
}
