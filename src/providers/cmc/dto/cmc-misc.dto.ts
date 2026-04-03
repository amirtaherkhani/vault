import { Exclude, Expose, Type } from 'class-transformer';
import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsObject, ValidateNested } from 'class-validator';
import { CmcEnvelopeDto, CmcStatusDto } from './cmc-base.response.dto';
import { CmcCryptoListingItemV1Dto } from './cmc-cryptocurrency.dto';

@Exclude()
@ApiExtraModels(CmcCryptoListingItemV1Dto, CmcStatusDto)
export class CmcCryptoListingsHistoricalDto extends CmcEnvelopeDto<
  CmcCryptoListingItemV1Dto[]
> {
  @ApiProperty({ type: () => [CmcCryptoListingItemV1Dto] })
  @ValidateNested({ each: true })
  @Type(() => CmcCryptoListingItemV1Dto)
  @Expose()
  data!: CmcCryptoListingItemV1Dto[];

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

// ---------------------------------------------------------------------------
// Generic wrappers for endpoints without detailed DTOs yet
// ---------------------------------------------------------------------------
@Exclude()
export class CmcGenericEnvelopeDto extends CmcEnvelopeDto<any> {
  @ApiProperty({ description: 'Payload', type: Object })
  @IsObject()
  @Expose()
  data!: any;

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

@Exclude()
export class CmcCryptoQuotesLatestV2Dto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcCryptoQuotesHistoricalV2Dto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcCryptoQuotesHistoricalV3Dto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcPricePerformanceStatsLatestDto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcPricePerformanceStatsLatestV2Dto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcCategoriesDto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcCategoryDto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcAirdropsDto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcAirdropDto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcExchangeListingsLatestDto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcExchangeQuotesHistoricalDto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcExchangeAssetsDto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcFearAndGreedLatestDto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcIndexCmc20LatestDto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcIndexCmc20HistoricalDto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcIndexCmc100LatestDto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcIndexCmc100HistoricalDto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcPriceConversionDto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcPriceConversionV2Dto extends CmcGenericEnvelopeDto {}
@Exclude()
export class CmcPostmanDto extends CmcGenericEnvelopeDto {}
