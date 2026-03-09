import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { InternalEventPayload } from '../types/internal-events.type';

export class InternalEventMessageDto {
  @ApiProperty({
    description: 'Identifier emitted by Redis Streams entry Id.',
    example: '1718293123456-0',
  })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({
    description: 'Event discriminator used to route to handlers.',
    example: 'wallet.created',
  })
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiPropertyOptional({
    description: 'Deserialized payload from the stream entry.',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  payload?: InternalEventPayload;

  @ApiProperty({
    description: 'ISO date string of when the event was created.',
    format: 'date-time',
  })
  @IsDateString()
  occurredAt: string;
}
