"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const express = __importStar(require("express"));
const fs = __importStar(require("fs"));
const path_1 = require("path");
const helmet_1 = __importDefault(require("helmet"));
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const nodeEnv = configService.get('nodeEnv') || 'development';
    const port = configService.get('port') || 3000;
    const apiPrefix = configService.get('apiPrefix') || 'api/v1';
    const jwtSecret = configService.get('jwtSecret');
    if (nodeEnv === 'production') {
        if (!jwtSecret ||
            jwtSecret.includes('change-me') ||
            jwtSecret === 'dev-jwt-secret-key-12345') {
            logger.error('CRITICAL SECURITY ERROR: Insecure or default JWT_SECRET detected in production environment!');
            throw new Error('Insecure JWT_SECRET configured for production. Refusing to start server.');
        }
    }
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    const uploadsDir = (0, path_1.join)(process.cwd(), 'uploads', 'profile-photos');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    app.use('/uploads', express.static((0, path_1.join)(process.cwd(), 'uploads')));
    app.setGlobalPrefix(apiPrefix);
    const corsOrigins = configService.get('corsOrigins');
    app.enableCors({
        origin: nodeEnv === 'production'
            ? corsOrigins && corsOrigins.length > 0
                ? corsOrigins
                : false
            : corsOrigins || true,
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
    await app.listen(port, '0.0.0.0');
    logger.log(`🚀 MLM Backend Server running in [${nodeEnv.toUpperCase()}] mode on: http://127.0.0.1:${port}/${apiPrefix}`);
    logger.log(`📚 Swagger Documentation available at: http://127.0.0.1:${port}/api/docs`);
}
void bootstrap().catch((err) => {
    console.error('Fatal error starting NestJS server:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map