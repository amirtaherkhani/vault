import {
  Injectable,
  Inject,
  HttpStatus,
  SerializeOptions,
  OnModuleInit,
} from '@nestjs/common';
import {
  GoRushCoreStatusResponseDto,
  GorushInfoDto,
  GoRushVersionResponseDto,
} from './dto/gorush-info.dto';
import {
  GoRushAppStatusResponseDto,
  GoRushMetricsJsonResponseDto,
  GoRushMetricsResponseDto,
  GoRushSystemStatsResponseDto,
} from './dto/gorush-monitor.dto';
import {
  PushNotificationRequestDto,
  PushNotificationResponseDto,
} from './dto/gorush-notify.dto';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import { ApiFunction } from 'src/common/api-gateway/types/api-gateway.type';
import { ApiGatewayService } from '../../common/api-gateway/api-gateway.service';
import { parseMetrics } from './gorush.helper';

import {
  mapPushNotificationRequest,
  mapPushNotificationResponse,
} from './infrastructure/persistence/relational/mappers/gorush.mapper';
import { BaseToggleableService } from 'src/common/base/base-toggleable.service';
import { stringifyJson } from '../../common/logger/utils/logger.helper';
import { GroupPlainToInstance } from 'src/utils/transformers/class.transformer';
import { RoleEnum } from 'src/roles/roles.enum';
import { SerializeGroups } from 'src/utils/transformers/enum.transformer';

@SerializeOptions(SerializeGroups([RoleEnum.admin]))
@Injectable()
export class GorushService
  extends BaseToggleableService
  implements OnModuleInit
{
  private apiClient: Record<string, ApiFunction> = {};

  constructor(
    private readonly apiSdkService: ApiGatewayService,
    private readonly configService: ConfigService<AllConfigType>,
    @Inject('API_GATEWAY_GORUSH') apiClient?: Record<string, ApiFunction>,
  ) {
    super(
      GorushService.name,
      configService.get('gorush.enable', false, { infer: true }),
    );

    if (apiClient) {
      this.apiClient = apiClient;
    }
  }

  async onModuleInit() {
    if (!this.isEnabled) {
      this.logger.warn('Gorush service is DISABLED. Skipping initialization.');
      return;
    }

    this.logger.log(
      'Gorush service is ENABLED. Proceeding with initialization.',
    );

    if (this.apiClient) {
      this.logger.log('Using injected API client for Gorush.');
    } else {
      this.logger.warn(
        'Injected API client is missing, retrieving from ApiSdkService.',
      );
      this.apiClient = this.apiSdkService.getClient('GORUSH');

      if (!this.apiClient) {
        this.logger.error('Failed to initialize API client for Gorush.');
        return;
      }
    }

    const baseUrl = this.configService.get<string>('gorush.baseUrl', {
      infer: true,
    });
    if (baseUrl) {
      this.updateGorushBaseUrl(baseUrl);
    }
    await this.checkConnection();
  }

  /**
   * Check if Gorush server is available
   */
  async checkConnection(): Promise<boolean> {
    try {
      const healthCheck = await this.checkHealth();
      this.logger.log(`Checking connection... ${healthCheck.status}`);
      if (healthCheck.status === HttpStatus.OK) {
        this.logger.debug('Gorush server is reachable.');
        this.logger.log('Gorush service connected successfully.');
        return true;
      } else {
        this.logger.warn(
          `Gorush server is not available: ${JSON.stringify(healthCheck)}`,
        );
        return false;
      }
    } catch (error) {
      this.logger.error(`Failed to connect to Gorush server: ${error.message}`);
      return false;
    }
  }

  /**
   * Update Gorush base URL dynamically
   */
  updateGorushBaseUrl(newBaseUrl: string) {
    this.logger.log(`Updating Gorush base URL to: ${newBaseUrl}`);
    this.apiSdkService.updateBaseUrl('GORUSH', newBaseUrl);
    this.apiClient = this.apiSdkService.getClient('GORUSH');
    if (!this.apiClient) {
      this.logger.error(`API client is still undefined after base URL update.`);
    } else {
      this.logger.log(`API client updated successfully with new base URL.`);
    }
  }

  /**
   * Get Gorush global statistics
   */
  async globalStats(): Promise<GoRushCoreStatusResponseDto> {
    const payload = await this.apiClient.getGoStats();
    return GroupPlainToInstance(
      GoRushCoreStatusResponseDto,
      this.unwrapPayload(payload),
      [RoleEnum.admin],
    );
  }

  /**
   * Get Gorush app statistics
   */
  async appStats(): Promise<GoRushAppStatusResponseDto> {
    const payload = await this.apiClient.getAppStats();
    return GroupPlainToInstance(
      GoRushAppStatusResponseDto,
      this.unwrapPayload(payload),
      [RoleEnum.admin],
    );
  }

  /**
   * Get system statistics
   */
  async systemStats(): Promise<GoRushSystemStatsResponseDto> {
    const payload = await this.apiClient.getSysStats();
    return GroupPlainToInstance(
      GoRushSystemStatsResponseDto,
      this.unwrapPayload(payload),
      [RoleEnum.admin],
    );
  }

  /**
   * Send a push notification
   */
  /**
   * Send a push notification
   */
  async sendPushNotification(
    payload: PushNotificationRequestDto,
  ): Promise<PushNotificationResponseDto> {
    this.logger.verbose(
      `Sending push notification: ${JSON.stringify(payload)}`,
    );

    try {
      const mappedPayload = mapPushNotificationRequest(payload);

      // NEW: pass body using RequestInput
      const response = await this.apiClient.sendPushNotification({
        body: mappedPayload,
      });

      const mappedResponse = mapPushNotificationResponse(
        this.unwrapPayload(response),
      );

      this.logger.verbose(
        `Push notification sent successfully. Count: ${mappedResponse.count}`,
      );

      return GroupPlainToInstance(PushNotificationResponseDto, mappedResponse, [
        RoleEnum.admin,
      ]);
    } catch (error) {
      this.logger.error(
        `Push notification failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get Gorush metrics
   */
  async metrics(
    asJson: boolean = false,
  ): Promise<GoRushMetricsResponseDto | GoRushMetricsJsonResponseDto> {
    try {
      const response = await this.apiClient.getMetrics();
      const payload = this.unwrapPayload<string>(response);
      if (!payload) {
        throw new Error('Empty response from Gorush metrics endpoint.');
      }
      if (typeof payload !== 'string') {
        throw new Error('Unexpected metrics payload type from Gorush.');
      }

      if (asJson) {
        const parsedMetrics = parseMetrics(payload);
        return GroupPlainToInstance(
          GoRushMetricsJsonResponseDto,
          { metrics: parsedMetrics },
          [RoleEnum.admin],
        );
      }

      return GroupPlainToInstance(
        GoRushMetricsResponseDto,
        { metrics: payload },
        [RoleEnum.admin],
      );
    } catch (error) {
      this.logger.error('Failed to fetch Gorush metrics', error.message);
      throw error;
    }
  }

  /**
   * Check health status
   */
  async checkHealth(): Promise<GorushInfoDto> {
    try {
      const response: any = await this.callHealthEndpoint();
      this.logger.verbose(`Checking ${stringifyJson(response)}`);
      const now = Math.floor(Date.now() / 1000);
      if (response.statusCode === HttpStatus.OK) {
        return GroupPlainToInstance(
          GorushInfoDto,
          {
            status: HttpStatus.OK,
            message: 'Gorush server is healthy',
            timestamp: now,
          },
          [RoleEnum.admin],
        );
      }
      return GroupPlainToInstance(
        GorushInfoDto,
        {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Gorush health check failed',
          timestamp: now,
        },
        [RoleEnum.admin],
      );
    } catch (error) {
      return GroupPlainToInstance(
        GorushInfoDto,
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Gorush Server not Available: ${error.message}`,
          timestamp: Math.floor(Date.now() / 1000),
        },
        [RoleEnum.admin],
      );
    }
  }

  private async callHealthEndpoint(): Promise<any> {
    try {
      return await this.apiClient.checkHealth();
    } catch (error) {
      if (this.apiClient?.checkHealthDuplicate) {
        return await this.apiClient.checkHealthDuplicate();
      }
      throw error;
    }
  }

  /**
   * Get Gorush version
   */
  async version(): Promise<GoRushVersionResponseDto> {
    if (!this.apiClient || !this.apiClient.getVersion) {
      this.logger.error('getVersion function is missing in API client.');
      throw new Error('Gorush API client is not initialized properly.');
    }
    const payload = await this.apiClient.getVersion();
    return GroupPlainToInstance(
      GoRushVersionResponseDto,
      this.unwrapPayload(payload),
      [RoleEnum.admin],
    );
  }

  private unwrapPayload<T>(payload: any): T {
    if (
      payload &&
      typeof payload === 'object' &&
      'data' in payload &&
      'statusCode' in payload
    ) {
      return payload.data as T;
    }
    return payload as T;
  }
}
