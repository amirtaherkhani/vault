import { TypeMessage } from '../../../../../../utils/types/message.type';
import { StrigaBaseResponseDto } from '../../../../dto/striga-base.response.dto';

type StrigaResponseEntity<T = unknown> = {
  statusCode: number;
  data: T;
  headers?: Record<string, unknown>;
};

export class StrigaResponseMapper {
  static toDomain<T = unknown>(raw: unknown): StrigaBaseResponseDto<T> {
    if (this.isDomain(raw)) {
      return raw as StrigaBaseResponseDto<T>;
    }

    const domainEntity = new StrigaBaseResponseDto<T>();
    const normalized = this.toEntity<T>(raw);

    if (normalized) {
      const status = this.toStatus(normalized.statusCode);
      domainEntity.status = status;

      domainEntity.success = status < 400;

      domainEntity.message = TypeMessage.getMessageByStatus(status);

      domainEntity.error = status < 400 ? null : normalized.data;

      domainEntity.data = status < 400 ? normalized.data : null;

      domainEntity.hasNextPage = false;

      return domainEntity;
    }

    const status = 200;
    domainEntity.status = status;

    domainEntity.success = true;

    domainEntity.message = TypeMessage.getMessageByStatus(status);

    domainEntity.error = null;

    domainEntity.data = (raw as T) ?? null;

    domainEntity.hasNextPage = false;

    return domainEntity;
  }

  static toPersistence<T = unknown>(
    domainEntity: StrigaBaseResponseDto<T>,
  ): StrigaResponseEntity<T | null> {
    const persistenceEntity: StrigaResponseEntity<T | null> = {
      statusCode: domainEntity.status,
      data: (domainEntity.data as T | null) ?? null,
      headers: {},
    };

    return persistenceEntity;
  }

  private static toEntity<T = unknown>(
    raw: unknown,
  ): StrigaResponseEntity<T> | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    if (!('statusCode' in raw) || !('data' in raw)) {
      return null;
    }

    return raw as StrigaResponseEntity<T>;
  }

  private static isDomain(raw: unknown): raw is StrigaBaseResponseDto {
    return (
      raw !== null &&
      typeof raw === 'object' &&
      'status' in raw &&
      'success' in raw &&
      'message' in raw &&
      'error' in raw &&
      'data' in raw &&
      'hasNextPage' in raw
    );
  }

  private static toStatus(value: unknown): number {
    const status = Number(value);
    return Number.isFinite(status) ? status : 200;
  }
}
