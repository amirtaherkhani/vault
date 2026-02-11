import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response } from 'express';
import { SessionService } from '../session.service';
import { extractSessionMetadata } from '../utils/session-metadata';

@Injectable()
export class SessionActivityMiddleware implements NestMiddleware {
  constructor(private readonly sessionService: SessionService) {}

  use(req, res: Response, next: () => void) {
    res.on('finish', async () => {
      const sessionId = req.user?.sessionId;
      if (!sessionId) {
        return;
      }

      const metadata = extractSessionMetadata(
        req.headers as Record<string, string | string[] | undefined>,
      );
      const updates: Record<string, unknown> = {
        lastUsedAt: new Date(),
      };
      if (metadata.deviceName) updates.deviceName = metadata.deviceName;
      if (metadata.deviceType) updates.deviceType = metadata.deviceType;
      if (metadata.appVersion) updates.appVersion = metadata.appVersion;
      if (metadata.country) updates.country = metadata.country;
      if (metadata.city) updates.city = metadata.city;

      try {
        await this.sessionService.update(sessionId, updates);
      } catch {
        // Ignore session update failures to avoid breaking responses.
      }
    });

    next();
  }
}
