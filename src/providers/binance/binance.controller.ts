import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/roles/roles.guard';
import { EnableGuard } from 'src/common/guards/service-enabled.guard';
import {
  RequireEnabled,
  RequireServiceReady,
} from 'src/utils/decorators/service-toggleable.decorators';
import { Roles } from 'src/roles/roles.decorator';
import { RoleEnum } from 'src/roles/roles.enum';
import { BinanceService } from './binance.service';
import { BinanceSocketService } from './binance.socket.service';
import { BinancePriceDto, BinancePriceQueryDto } from './dto/binance-price.dto';
import {
  BinanceHistoryQueryDto,
  BinanceCandleDto,
} from './dto/binance-klines.dto';
import {
  BinanceChartHeaderDto,
  BinanceChartHeaderQueryDto,
  BinanceChartMidPriceDto,
  BinanceChartMidPriceQueryDto,
  BinanceChartSeriesDto,
  BinanceChartSeriesQueryDto,
  BinanceChartSeriesRangeDto,
  BinanceChartSeriesRangeQueryDto,
} from './dto/binance-chart.dto';
import { BinanceHealthDto } from './dto/binance-health.dto';
import {
  BinanceSupportedAssetDto,
  BinanceSupportedAssetsQueryDto,
} from './dto/binance-account.dto';
import {
  BinanceExecutionRulesResponseDto,
  BinanceExchangeInfoResponseDto,
  BinanceTimeResponseDto,
} from './dto/binance-base.response.dto';
import {
  BinanceExecutionRulesRequestDto,
  BinanceExchangeInfoRequestDto,
} from './dto/binance-base.request.dto';
import {
  BinanceExchangeInfoApiQueryDto,
  BinanceExecutionRulesApiQueryDto,
} from './dto/binance-exchange-execution.api.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard, EnableGuard)
@RequireEnabled('binance.enable')
@RequireServiceReady(BinanceService)
@ApiTags('Binance')
@Controller({ path: 'binance', version: '1' })
export class BinanceController {
  constructor(
    private readonly service: BinanceService,
    private readonly socketService: BinanceSocketService,
  ) {}

  @Roles(RoleEnum.admin)
  @Get('price')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [BinancePriceDto] })
  async findTickerPrices(
    @Query() query: BinancePriceQueryDto,
  ): Promise<BinancePriceDto[]> {
    return this.service.findTickerPrices(query);
  }

  @Roles(RoleEnum.admin)
  @Get('history')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [BinanceCandleDto] })
  async findKlines(
    @Query() query: BinanceHistoryQueryDto,
  ): Promise<BinanceCandleDto[]> {
    return this.service.findKlines(query);
  }

  @Roles(RoleEnum.admin)
  @Get('supported-assets')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [BinanceSupportedAssetDto] })
  async findSupportedAssets(
    @Query() query: BinanceSupportedAssetsQueryDto,
  ): Promise<BinanceSupportedAssetDto[]> {
    return this.service.findSupportedAssets(query);
  }

  @Roles(RoleEnum.admin)
  @Get('chart/header')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BinanceChartHeaderDto })
  async findChartHeader(
    @Query() query: BinanceChartHeaderQueryDto,
  ): Promise<BinanceChartHeaderDto> {
    return this.service.findChartHeader(query);
  }

  @Roles(RoleEnum.admin)
  @Get('chart/series')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BinanceChartSeriesDto })
  async findChartSeries(
    @Query() query: BinanceChartSeriesQueryDto,
  ): Promise<BinanceChartSeriesDto> {
    return this.service.findChartSeries(query);
  }

  @Roles(RoleEnum.admin)
  @Get('chart/mid-price')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [BinanceChartMidPriceDto] })
  async findChartMidPrice(
    @Query() query: BinanceChartMidPriceQueryDto,
  ): Promise<BinanceChartMidPriceDto[]> {
    return this.service.findChartMidPrices(query);
  }

  @Roles(RoleEnum.admin)
  @Get('chart/series-range')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BinanceChartSeriesRangeDto })
  async findChartSeriesRange(
    @Query() query: BinanceChartSeriesRangeQueryDto,
  ): Promise<BinanceChartSeriesRangeDto> {
    return this.service.findChartSeriesRange(query);
  }

  @Get('healthz')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: BinanceHealthDto,
    description:
      'Binance provider health (REST + Socket.IO). ok=true only if both are healthy.',
  })
  async health(): Promise<BinanceHealthDto> {
    return await this.service.health();
  }

  @Roles(RoleEnum.admin)
  @Get('time')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BinanceTimeResponseDto })
  async time(): Promise<BinanceTimeResponseDto> {
    return this.service.getServerTime();
  }

  @Roles(RoleEnum.admin)
  @Get('exchange-info')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BinanceExchangeInfoResponseDto })
  async exchangeInfo(
    @Query() query: BinanceExchangeInfoApiQueryDto,
  ): Promise<BinanceExchangeInfoResponseDto> {
    return this.service.findExchangeInfo(
      query as BinanceExchangeInfoRequestDto,
    );
  }

  @Roles(RoleEnum.admin)
  @Get('execution-rules')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BinanceExecutionRulesResponseDto })
  async findExecutionRules(
    @Query() query: BinanceExecutionRulesApiQueryDto,
  ): Promise<BinanceExecutionRulesResponseDto> {
    return this.service.findExecutionRules(
      query as BinanceExecutionRulesRequestDto,
    );
  }
}
