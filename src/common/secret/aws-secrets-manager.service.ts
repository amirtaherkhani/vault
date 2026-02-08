import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { AwsSecretsManagerConfig } from 'src/config/types/aws-secrets-manager-config.type';
import {
  AwsSecretsManagerClient,
  AwsSecretsManagerOptions,
} from './aws-secrets-manager.client';
import { BaseToggleableService } from '../base/base-toggleable.service';
import { buildAwsSecretsOptionsFromEnv } from 'src/config/aws-secrets-manager.config';

@Injectable()
export class AwsSecretsManagerService extends BaseToggleableService {
  static readonly displayName = 'AWS Secrets Manager';

  private readonly secretsConfig: AwsSecretsManagerConfig;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    const config =
      configService.get<AwsSecretsManagerConfig>('awsSecretsManager', {
        infer: true,
      }) ?? buildAwsSecretsOptionsFromEnv();

    super(AwsSecretsManagerService.name, config.enable, {
      id: 'aws-secrets-manager',
      displayName: AwsSecretsManagerService.displayName,
      configKey: 'awsSecretsManager.enable',
      envKey: 'AWS_SECRETS_MANAGER_ENABLE',
      description: 'AWS Secrets Manager integration.',
      tags: ['Manager'],
    });
    this.secretsConfig = config;
  }

  get config(): AwsSecretsManagerConfig {
    return { ...this.secretsConfig };
  }

  async syncSecretsToEnv(context = 'Bootstrap'): Promise<void> {
    this.logger.debug(
      `${context}: AWS Secrets Manager sync requested (enabled=${this.isEnabled}).`,
    );

    this.checkIfEnabled();
    const options = this.buildOptions();

    this.logger.debug(
      `${context}: AWS Secrets Manager options -> region="${
        this.secretsConfig.region || 'undefined'
      }", setToEnv=${options.isSetToEnv}, debug=${
        options.isDebug ?? false
      }, secrets=${this.describeSecrets(options.secretsSource)}.`,
    );

    if (!options.secretsSource || options.secretsSource.length === 0) {
      this.logger.warn(
        `${context}: No secret identifiers configured. Skipping AWS Secrets pull.`,
      );
      return;
    }

    if (!this.secretsConfig.region) {
      this.logger.warn(
        `${context}: AWS region is not configured. Skipping AWS Secrets pull.`,
      );
      return;
    }

    this.logger.log(
      `${context}: Fetching AWS secrets (${this.describeSecrets(
        options.secretsSource,
      )}) to populate environment variables...`,
    );

    const secretsService = new AwsSecretsManagerClient(options);

    try {
      await secretsService.setAllSecretsToEnv();
      this.logger.log(
        `${context}: AWS secrets loaded into process.env and ready for ConfigService consumers.`,
      );
    } catch (error) {
      this.logger.error(
        `${context}: Failed to load AWS secrets: ${(error as Error).message}`,
        (error as Error)?.stack,
      );
      throw error;
    }
  }

  async getSecretsById<T>(secretId: string): Promise<T> {
    this.logger.debug(`Direct secret read requested for "${secretId}".`);
    this.checkIfEnabled();
    const options = this.buildOptions();

    if (!secretId) {
      const message = 'Secret identifier is required to fetch secrets by id.';
      this.logger.error(message);
      throw new Error(message);
    }

    if (!this.secretsConfig.region) {
      const message =
        'AWS region is not configured. Cannot fetch secret by id.';
      this.logger.warn(message);
      throw new Error(message);
    }

    try {
      this.logger.log(
        `Fetching AWS secret "${secretId}" using region ${this.secretsConfig.region}...`,
      );
      const secretsService = new AwsSecretsManagerClient(options);
      const secret = await secretsService.getSecretsByID<T>(secretId);
      this.logger.log(`AWS secret "${secretId}" successfully retrieved.`);
      return secret;
    } catch (error) {
      this.logger.error(
        `Failed to fetch AWS secret "${secretId}": ${(error as Error).message}`,
        (error as Error)?.stack,
      );
      throw error;
    }
  }

  private buildOptions(): AwsSecretsManagerOptions {
    const secretsSource =
      this.secretsConfig.secretIds.length === 1
        ? this.secretsConfig.secretIds[0]
        : this.secretsConfig.secretIds;

    this.logger.debug(
      `Preparing AWS Secrets Manager client for region="${
        this.secretsConfig.region || 'undefined'
      }" with sources: ${this.describeSecrets(secretsSource)}.`,
    );

    return {
      secretsManager: new SecretsManagerClient({
        region: this.secretsConfig.region,
      }),
      isSetToEnv: this.secretsConfig.setToEnv,
      secretsSource,
      isDebug: this.secretsConfig.debug,
    };
  }

  private describeSecrets(source?: string | string[]): string {
    if (!source || (Array.isArray(source) && source.length === 0)) {
      return 'none configured';
    }

    return Array.isArray(source) ? source.join(', ') : source;
  }
}
