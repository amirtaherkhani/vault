import { INestApplication, Logger, Module } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import { ScalarThemeEnum } from './api-docs.enum';

@Module({})
export class APIDocs {
  private static readonly logger = new Logger('APIDoc');

  static async setup(
    app: INestApplication,
    options: ReturnType<DocumentBuilder['build']>,
  ) {
    const document = SwaggerModule.createDocument(app, options);

    // Apply Swagger Theme
    const theme = new SwaggerTheme();
    const swaggerThemeCSS = theme.getBuffer(SwaggerThemeNameEnum.CLASSIC); // Use a dark theme base
    const customCss = `
    ${swaggerThemeCSS}

    /* API Button Colors */
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background-color: #007BFF !important; /* Blue for GET */
    }

    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background-color:rgb(42, 169, 42) !important; /* Dark Green for POST */
    }

    .swagger-ui .opblock.opblock-patch .opblock-summary-method {
      background-color: #FFA500 !important; /* Orange for PATCH */
    }

    .swagger-ui .opblock.opblock-delete .opblock-summary-method {
      background-color: #FF0000 !important; /* Red for DELETE */
}

    /* API Method Colors */
    .swagger-ui .opblock.opblock-get {
      border-color: #20c997 !important; /* Green for GET */
    }
  
    .swagger-ui .opblock.opblock-post {
      border-color: #40916c !important; /* Blue for POST */
    }
  
    .swagger-ui .opblock.opblock-patch {
      border-color: #a855f7 !important; /* Purple for PATCH */
    }
  
    .swagger-ui .opblock.opblock-delete {
      border-color: #f43f5e !important; /* Red for DELETE */
    }

    /* Disabled endpoints (Deprecated marker) */
    .swagger-ui .opblock.deprecated,
    .swagger-ui .opblock.is-deprecated,
    .swagger-ui .opblock.opblock-deprecated {
      border-color: #9ca3af !important;
      background: #f3f4f6 !important;
    }
    .swagger-ui .opblock.deprecated .opblock-summary,
    .swagger-ui .opblock.is-deprecated .opblock-summary,
    .swagger-ui .opblock.opblock-deprecated .opblock-summary {
      border-color: #9ca3af !important;
      background: #e5e7eb !important;
    }
    .swagger-ui .opblock.deprecated .opblock-summary-method,
    .swagger-ui .opblock.is-deprecated .opblock-summary-method,
    .swagger-ui .opblock.opblock-deprecated .opblock-summary-method {
      background-color: #6b7280 !important;
      color: #f9fafb !important;
    }
    .swagger-ui .opblock.deprecated .opblock-summary-path,
    .swagger-ui .opblock.is-deprecated .opblock-summary-path,
    .swagger-ui .opblock.opblock-deprecated .opblock-summary-path,
    .swagger-ui .opblock.deprecated .opblock-summary-description,
    .swagger-ui .opblock.is-deprecated .opblock-summary-description,
    .swagger-ui .opblock.opblock-deprecated .opblock-summary-description {
      color: #4b5563 !important;
    }
    .swagger-ui .opblock.deprecated .opblock-summary-control:after,
    .swagger-ui .opblock.is-deprecated .opblock-summary-control:after,
    .swagger-ui .opblock.opblock-deprecated .opblock-summary-control:after {
      color: #4b5563 !important;
    }

    /* Hide Swagger Top Bar */
    .swagger-ui .topbar {
      display: none !important;
    }
  `;

    SwaggerModule.setup('/docs/swagger', app, document, {
      customCss: customCss, // Apply theme styles
      explorer: true,
      customSiteTitle: `${APP.name} API`,
    });

    app.getHttpAdapter().get('/api-docs', (_req, res) => {
      res.redirect('/docs/swagger');
    });

    // Serve OpenAPI JSON
    app.getHttpAdapter().get('/openapi.json', (_req, res) => {
      res.json(document);
    });

    // Scalar API Reference Middleware
    app.use(
      '/docs',
      apiReference({
        theme: ScalarThemeEnum.Kepler,
        spec: {
          content: document,
        },
        config: {
          cssOverrides: `
            body {
              font-size: 24px !important;  /* Increase base font size */
            }
            .api-reference {
              font-size: 22px !important;
            }
            h1, h2, h3, h4 {
              font-size: 26px !important;  /* Increase headings */ 
            }
          `,
        },
      }),
    );

    // Fake awaits to satisfy the ESLint rule.
    await Promise.resolve();
  }

  static async info(app: INestApplication) {
    const httpServer = app.getHttpServer?.();
    if (
      httpServer &&
      typeof httpServer.once === 'function' &&
      httpServer.listening !== true
    ) {
      await new Promise<void>((resolve) =>
        httpServer.once('listening', () => resolve()),
      );
    }

    if (!httpServer || httpServer.listening !== true) {
      this.logger.debug(
        'Skipping docs URL log because HTTP server is not listening yet',
      );
      return;
    }

    try {
      let appUrl = await app.getUrl();
      appUrl = appUrl.replace('[::1]', 'localhost');
      this.logger.log(`[Swagger] Docs available at: ${appUrl}/docs/swagger`);
      this.logger.log(`[API] Reference available at: ${appUrl}/docs`);
      this.logger.log(`[OpenAPI] JSON available at: ${appUrl}/openapi.json`);
    } catch (error: unknown) {
      this.logger.error(
        `Unable to resolve app URL for docs: ${
          (error as any)?.message ?? error
        }`,
      );
    }
  }
}
