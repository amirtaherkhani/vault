import { PartialType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { CreateStrigaUserDto } from './create-striga-user.dto';

@Exclude()
export class UpdateStrigaUserDto extends PartialType(CreateStrigaUserDto) {}
