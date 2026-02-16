import { Module } from '@nestjs/common';
import { EnableGuard } from 'src/common/guards/service-enabled.guard';
import { ProvidersModule } from '../providers.module';
import { StrigaController } from './striga.controller';
import { StrigaService } from './striga.service';

@Module({
  imports: [ProvidersModule],
  providers: [StrigaService, EnableGuard],
  controllers: [StrigaController],
  exports: [StrigaService],
})
export class StrigaModule {}
