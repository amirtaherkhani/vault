import { Injectable } from '@nestjs/common';
import { StrigaService } from '../striga.service';
import { StrigaBaseService } from './striga-base.service';

@Injectable()
export class StrigaWalletService extends StrigaBaseService {
  constructor(strigaService: StrigaService) {
    super(strigaService);
  }
}
