"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('port') || 3000;
    const apiPrefix = configService.get('apiPrefix') || 'api/v1';
    app.setGlobalPrefix(apiPrefix);
    app.enableCors({
        origin: configService.get('corsOrigins') || true,
        credentials: true,
    });
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('AAKASH MLM Backend API')
        .setDescription('REST API Documentation for AAKASH E-COM Multi-Level Marketing Backend Service')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    await app.listen(port);
    console.log(`🚀 MLM Backend Server running on: http://localhost:${port}/${apiPrefix}`);
    console.log(`📚 Swagger Documentation available at: http://localhost:${port}/api/docs`);
}
void bootstrap().catch((err) => {
    console.error('Fatal error starting NestJS server:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map