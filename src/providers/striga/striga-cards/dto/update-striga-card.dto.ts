// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { PartialType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { CreateStrigaCardDto } from './create-striga-card.dto';

@Exclude()
export class UpdateStrigaCardDto extends PartialType(CreateStrigaCardDto) {}
