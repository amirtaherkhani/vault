import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { format } from 'date-fns';
import { LoggerType, LogLevel } from './types/logger-enum.type';
import {
  stringifyJson,
  formatNestHeader,
  normalizeLogSentenceCase,
} from './utils/logger.helper';
import chalk from 'chalk';

type LoggerMeta = {
  context?: string;
  loadTime?: number;
  eventId?: string | null;
  taskId?: string | null;
};

type ErrorLoggerMeta = LoggerMeta & {
  trace?: string;
};

type ParsedCommonArgs = {
  context?: string;
  loadTime?: number;
  eventId?: string | null;
  taskId?: string | null;
};

type ParsedErrorArgs = ParsedCommonArgs & {
  trace?: string;
};

type NormalizedLogMessage = {
  message: string;
  eventId: string | null;
  taskId: string | null;
};

@Injectable()
export class LoggerService implements NestLoggerService {
  private lastLogTime = Date.now();

  log(
    message: any,
    contextOrMeta?: string | LoggerMeta,
    loadTime?: number,
    eventId?: string | null,
    taskId?: string | null,
  ) {
    const parsed = this.parseCommonArgs(
      contextOrMeta,
      loadTime,
      eventId,
      taskId,
    );
    console.log(
      this.format(
        LoggerType.SYSTEM,
        message,
        parsed.context,
        undefined,
        parsed.loadTime,
        LogLevel.LOG,
        parsed.eventId,
        parsed.taskId,
      ),
    );
  }

  error(
    message: any,
    traceOrMeta?: string | ErrorLoggerMeta,
    contextOrMeta?: string | LoggerMeta,
    loadTime?: number,
    eventId?: string | null,
    taskId?: string | null,
  ) {
    const parsed = this.parseErrorArgs(
      traceOrMeta,
      contextOrMeta,
      loadTime,
      eventId,
      taskId,
    );
    console.error(
      this.format(
        LoggerType.SYSTEM,
        message,
        parsed.context,
        parsed.trace,
        parsed.loadTime,
        LogLevel.ERROR,
        parsed.eventId,
        parsed.taskId,
      ),
    );
  }

  warn(
    message: any,
    contextOrMeta?: string | LoggerMeta,
    loadTime?: number,
    eventId?: string | null,
    taskId?: string | null,
  ) {
    const parsed = this.parseCommonArgs(
      contextOrMeta,
      loadTime,
      eventId,
      taskId,
    );
    console.warn(
      this.format(
        LoggerType.SYSTEM,
        message,
        parsed.context,
        undefined,
        parsed.loadTime,
        LogLevel.WARN,
        parsed.eventId,
        parsed.taskId,
      ),
    );
  }

  debug(
    message: any,
    contextOrMeta?: string | LoggerMeta,
    loadTime?: number,
    eventId?: string | null,
    taskId?: string | null,
  ) {
    const parsed = this.parseCommonArgs(
      contextOrMeta,
      loadTime,
      eventId,
      taskId,
    );
    console.debug(
      this.format(
        LoggerType.DEV,
        message,
        parsed.context,
        undefined,
        parsed.loadTime,
        LogLevel.DEBUG,
        parsed.eventId,
        parsed.taskId,
      ),
    );
  }

  verbose(
    message: any,
    contextOrMeta?: string | LoggerMeta,
    loadTime?: number,
    eventId?: string | null,
    taskId?: string | null,
  ) {
    const parsed = this.parseCommonArgs(
      contextOrMeta,
      loadTime,
      eventId,
      taskId,
    );
    console.debug(
      this.format(
        LoggerType.DEV,
        message,
        parsed.context,
        undefined,
        parsed.loadTime,
        LogLevel.TRACE,
        parsed.eventId,
        parsed.taskId,
      ),
    );
  }

  private format(
    type: LoggerType,
    message: any,
    context?: string,
    trace?: string,
    loadTime?: number,
    level?: LogLevel,
    eventId?: string | null,
    taskId?: string | null,
  ): string {
    const timestamp = format(new Date(), 'MM/dd/yyyy, h:mm:ss a');
    const ctx = context ?? '';
    const normalizedMessage = this.normalizeMessage(message);
    const effectiveEventId = this.resolveEventId(
      eventId,
      normalizedMessage.eventId,
    );
    const effectiveTaskId = this.resolveTaskId(
      taskId,
      normalizedMessage.taskId,
    );
    const msg = normalizedMessage.message;
    const traceStr = trace ? `\n${trace}` : '';
    const now = Date.now();
    const deltaTime = now - this.lastLogTime;
    this.lastLogTime = now;
    const durationStr = ` +${deltaTime}ms`;

    const rawLevel = (level ?? LogLevel.LOG).toUpperCase();
    let coloredLevel: string;
    switch (rawLevel) {
      case LogLevel.ERROR.toUpperCase():
        coloredLevel = chalk.redBright(rawLevel);
        break;
      case LogLevel.WARN.toUpperCase():
        coloredLevel = chalk.yellowBright(rawLevel);
        break;
      case LogLevel.DEBUG.toUpperCase():
        coloredLevel = chalk.cyanBright(rawLevel);
        break;
      case LogLevel.TRACE.toUpperCase():
        coloredLevel = chalk.magentaBright(rawLevel);
        break;
      case LogLevel.FATAL.toUpperCase():
        coloredLevel = chalk.bgRed.whiteBright(rawLevel);
        break;
      default:
        coloredLevel = chalk.greenBright(rawLevel);
        break;
    }

    const header = formatNestHeader(timestamp, coloredLevel, ctx, type);
    const eventTag = this.formatEventTag(effectiveEventId);
    const taskTag = this.formatTaskTag(effectiveTaskId);
    const externalTags = [eventTag, taskTag].filter(Boolean).join(' ');

    return `${header}${externalTags ? ` ${externalTags}` : ''} ${msg}${traceStr}${durationStr}`;
  }

  private normalizeMessage(message: any): NormalizedLogMessage {
    if (typeof message === 'object') {
      return {
        message: stringifyJson(
          message && Object.keys(message).length ? message : {},
        ),
        eventId: null,
        taskId: null,
      };
    }

    const extracted = this.extractInlineTags(String(message));
    return {
      message: normalizeLogSentenceCase(extracted.message),
      eventId: extracted.eventId,
      taskId: extracted.taskId,
    };
  }

  private parseCommonArgs(
    contextOrMeta?: string | LoggerMeta,
    loadTime?: number,
    eventId?: string | null,
    taskId?: string | null,
  ): ParsedCommonArgs {
    if (this.isLoggerMeta(contextOrMeta)) {
      return {
        context: contextOrMeta.context,
        loadTime: contextOrMeta.loadTime ?? loadTime,
        eventId: this.resolveEventId(contextOrMeta.eventId, eventId),
        taskId: this.resolveTaskId(contextOrMeta.taskId, taskId),
      };
    }

    return {
      context: contextOrMeta,
      loadTime,
      eventId: this.normalizeTagValue(eventId),
      taskId: this.normalizeTagValue(taskId),
    };
  }

  private parseErrorArgs(
    traceOrMeta?: string | ErrorLoggerMeta,
    contextOrMeta?: string | LoggerMeta,
    loadTime?: number,
    eventId?: string | null,
    taskId?: string | null,
  ): ParsedErrorArgs {
    if (this.isErrorLoggerMeta(traceOrMeta)) {
      return {
        trace: traceOrMeta.trace,
        context: traceOrMeta.context,
        loadTime: traceOrMeta.loadTime ?? loadTime,
        eventId: this.resolveEventId(traceOrMeta.eventId, eventId),
        taskId: this.resolveTaskId(traceOrMeta.taskId, taskId),
      };
    }

    if (this.isLoggerMeta(contextOrMeta)) {
      return {
        trace: traceOrMeta,
        context: contextOrMeta.context,
        loadTime: contextOrMeta.loadTime ?? loadTime,
        eventId: this.resolveEventId(contextOrMeta.eventId, eventId),
        taskId: this.resolveTaskId(contextOrMeta.taskId, taskId),
      };
    }

    return {
      trace: traceOrMeta,
      context: contextOrMeta,
      loadTime,
      eventId: this.normalizeTagValue(eventId),
      taskId: this.normalizeTagValue(taskId),
    };
  }

  private isLoggerMeta(value: unknown): value is LoggerMeta {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  private isErrorLoggerMeta(value: unknown): value is ErrorLoggerMeta {
    return this.isLoggerMeta(value);
  }

  private resolveEventId(
    eventId?: string | null,
    inputEventId?: string | null,
  ): string | null {
    return (
      this.normalizeTagValue(eventId) ?? this.normalizeTagValue(inputEventId)
    );
  }

  private resolveTaskId(
    taskId?: string | null,
    inputTaskId?: string | null,
  ): string | null {
    return (
      this.normalizeTagValue(taskId) ?? this.normalizeTagValue(inputTaskId)
    );
  }

  private normalizeTagValue(value: unknown): string | null {
    const normalized = String(value ?? '').trim();
    return normalized.length > 0 ? normalized : null;
  }

  private extractInlineTags(message: string): {
    message: string;
    eventId: string | null;
    taskId: string | null;
  } {
    if (!message) {
      return { message, eventId: null, taskId: null };
    }

    let extractedEventId: string | null = null;
    let extractedTaskId: string | null = null;

    const cleaned = message
      .replace(
        /\[(trace|event|eventid|task|taskid)\s*=\s*([^\]]+)\]\s*/gi,
        (_raw, key: string, value: string) => {
          const normalizedValue = this.normalizeTagValue(value);
          const normalizedKey = key.toLowerCase();

          if (
            !extractedEventId &&
            normalizedValue &&
            ['trace', 'event', 'eventid'].includes(normalizedKey)
          ) {
            extractedEventId = normalizedValue;
          }

          if (
            !extractedTaskId &&
            normalizedValue &&
            ['task', 'taskid'].includes(normalizedKey)
          ) {
            extractedTaskId = normalizedValue;
          }

          return '';
        },
      )
      .trimStart();

    return {
      message: cleaned,
      eventId: extractedEventId,
      taskId: extractedTaskId,
    };
  }

  private formatEventTag(eventId?: string | null): string {
    const normalized = this.normalizeTagValue(eventId);
    if (!normalized) {
      return '';
    }

    return chalk.cyan(`[EVENT:${normalized}]`);
  }

  private formatTaskTag(taskId?: string | null): string {
    const normalized = this.normalizeTagValue(taskId);
    if (!normalized) {
      return '';
    }

    return chalk.blueBright(`[TASK:${normalized}]`);
  }
}
