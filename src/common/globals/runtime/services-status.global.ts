import { Logger } from '@nestjs/common';
import {
  BaseToggleableService,
  ToggleableServiceSnapshot,
} from '../../base/base-toggleable.service';

const logger = new Logger('ServiceStatusGlobals');

type ServiceStatusSource = {
  getAll: () => ToggleableServiceSnapshot[];
};

declare global {
  var SERVICES_STATUS: Readonly<ServiceStatusSource>;
}

globalThis.SERVICES_STATUS = Object.freeze({
  getAll: () => BaseToggleableService.getToggleableServices(),
});

logger.log('Initialized global service status accessor.');

export {};
