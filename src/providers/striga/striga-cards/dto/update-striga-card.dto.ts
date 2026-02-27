// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { PartialType } from '@nestjs/swagger';
import { CreateStrigaCardDto } from './create-striga-card.dto';

export class UpdateStrigaCardDto extends PartialType(CreateStrigaCardDto) {}
