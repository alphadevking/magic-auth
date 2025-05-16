import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MagicLoginAuthStrategy } from './magin-login.strategy';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createKeyv } from '@keyv/redis';

@Module({
    imports: [
        PassportModule,
        ConfigModule, // Import ConfigModule to use ConfigService
        JwtModule.registerAsync({ // Configure JwtModule
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: configService.get<string>('JWT_EXPIRY') },
            }),
            inject: [ConfigService],
        }),
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const otpExpirySeconds = configService.get<number>('OTP_EXPIRY_SECONDS', 300); // Value is in seconds
                const redisUrl = configService.get<string>('REDIS_URL');
                if (!redisUrl) {
                    throw new Error('REDIS_URL environment variable not set. Please ensure it is configured in your .env file.');
                }
                return {
                    stores: [
                        // createKeyv(`redis://${redisHost}:${redisPort}`)
                        createKeyv(redisUrl)
                    ],
                    ttl: otpExpirySeconds * 1000, // Convert seconds to milliseconds for global TTL
                };
            },
            inject: [ConfigService],
        }),
    ],
    providers: [
        AuthService,
        MagicLoginAuthStrategy,
    ],
    controllers: [AuthController],
})
export class AuthModule { }
