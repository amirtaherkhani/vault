import {
  // common
  Module,
  forwardRef,
  MiddlewareConsumer,
  NestModule,
} from '@nestjs/common';
import { RelationalSessionPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { SessionService } from './session.service';
import { SessionsController } from './session.controller';
import { AuthModule } from '../auth/auth.module';
import { SessionActivityMiddleware } from './middleware/session-activity.middleware';

const infrastructurePersistenceModule = RelationalSessionPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule, forwardRef(() => AuthModule)],
  controllers: [SessionsController],
  providers: [SessionService, SessionActivityMiddleware],
  exports: [SessionService, infrastructurePersistenceModule],
})
export class SessionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionActivityMiddleware).forRoutes('*');
  }
}
