import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import databaseConfig from './database/config/database.config';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import mailConfig from './mail/config/mail.config';
import fileConfig from './files/config/file.config';
import googleConfig from './auth-google/config/google.config';
import appleConfig from './auth-apple/config/apple.config';
import path from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthAppleModule } from './auth-apple/auth-apple.module';
import { AuthGoogleModule } from './auth-google/auth-google.module';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { MailModule } from './mail/mail.module';
import { HomeModule } from './home/home.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AllConfigType } from './config/config.type';
import { SessionModule } from './session/session.module';
import { MailerModule } from './mailer/mailer.module';
import veroConfig from './auth-vero/config/vero.config';
import { SecretManagerModule } from './common/secret/secret.module';
import { AuthVeroModule } from './auth-vero/auth-vero.module';
import { GorushModule } from './providers/gorush/gorush.module';
import { RabbitMQService } from './communication/rabbitMQ/rabbitmq.service';
import gorushConfig from './providers/gorush/config/gorush.config';
import rabbitmqConfig from './communication/rabbitMQ/config/rabbitmq.config';
import { NotificationsModule } from './notifications/notifications.module';
import { DevicesModule } from './devices/devices.module';
import { MinioModule } from './providers/minio/minio.module';
import minioConfig from './providers/minio/config/minio.config';
import { LoggerModule } from './common/logger/logger.module';
import { SocketIoModule } from './communication/socketio/socketio.module';
import { PassphrasesModule } from './passphrases/passphrases.module';
import { MessagesModule } from './messages/messages.module';
import { AddressBooksModule } from './address-books/address-books.module';
import { FireblocksCwWalletsModule } from './fireblocks-cw-wallets/fireblocks-cw-wallets.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { CmcModule } from './providers/cmc/cmc.module';
import cmcConfig from './providers/cmc/config/cmc-config';
import { ProvidersModule } from './providers/providers.module';
import { StrigaModule } from './providers/striga/striga.module';
import strigaConfig from './providers/striga/config/striga.config';
import awsSecretsManagerConfig from './config/aws-secrets-manager.config';
import fireblocksConfig from './providers/fireblocks/cw/config/fireblocks.config';
import { FireblocksCwModule } from './providers/fireblocks/cw/fireblocks-cw.module';
import queuedashConfig from './common/queuedash/config/queuedash.config';
import internalEventsConfig from './common/internal-events/config/internal-events.config';
import cacheConfig from './common/cache/config/cache.config';

const infrastructureDatabaseModule = TypeOrmModule.forRootAsync({
  useClass: TypeOrmConfigService,
  dataSourceFactory: async (options: DataSourceOptions) => {
    return new DataSource(options).initialize();
  },
});

import { AccountsModule } from './accounts/accounts.module';
import { QueueDashModule } from './common/queuedash/queuedash.module';

import { InternalEventsModule as InternalEventsFeatureModule } from './internal-events/internal-events.module';
import { InternalEventsModule as InternalEventsCoreModule } from './common/internal-events/internal-events.module';
import { SleevesTransactionsModule } from './sleeves-transactions/sleeves-transactions.module';
import { SleevesModule } from './sleeves/sleeves.module';
import { AssetRegistriesModule } from './asset-registries/asset-registries.module';
import { CacheModule } from './common/cache/cache.module';

import { StrigaUsersModule } from './providers/striga/striga-users/striga-users.module';

@Module({
  imports: [
    StrigaUsersModule,
    AssetRegistriesModule,
    AssetRegistriesModule,
    SleevesModule,
    SleevesTransactionsModule,
    InternalEventsCoreModule.forRootAsync(),
    InternalEventsFeatureModule,
    AccountsModule,
    QueueDashModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        fileConfig,
        googleConfig,
        appleConfig,
        veroConfig,
        gorushConfig,
        rabbitmqConfig,
        minioConfig,
        cmcConfig,
        strigaConfig,
        awsSecretsManagerConfig,
        fireblocksConfig,
        queuedashConfig,
        internalEventsConfig,
        cacheConfig,
      ],
      envFilePath: ['.env'],
    }),
    FireblocksCwWalletsModule,
    FireblocksCwModule,
    MessagesModule,
    PassphrasesModule,
    AddressBooksModule,
    DevicesModule,
    NotificationsModule,
    WebhooksModule,
    infrastructureDatabaseModule,
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loaderOptions: { path: path.join(__dirname, '../i18n/'), watch: true },
      }),
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService<AllConfigType>) => {
            return [
              configService.get('app.headerLanguage', {
                infer: true,
              }),
            ];
          },
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    UsersModule,
    FilesModule,
    AuthModule,
    AuthGoogleModule,
    AuthAppleModule,
    SessionModule,
    MailModule,
    MailerModule,
    HomeModule,
    AuthVeroModule,
    SecretManagerModule,
    GorushModule,
    MinioModule,
    LoggerModule,
    CacheModule,
    SocketIoModule,
    CmcModule,
    StrigaModule,
    ProvidersModule,
  ],
  providers: [RabbitMQService],
})
export class AppModule {}
