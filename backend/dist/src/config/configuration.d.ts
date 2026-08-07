export interface AppConfig {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    databaseUrl: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    redisHost: string;
    redisPort: number;
    redisPassword?: string;
    corsOrigins: string[];
}
declare const _default: () => AppConfig;
export default _default;
