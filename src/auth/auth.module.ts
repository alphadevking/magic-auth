import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { MagicLoginAuthStrategy } from './magin-login.strategy';

@Module({
    imports: [PassportModule],
    providers: [
        AuthService,
        MagicLoginAuthStrategy,
    ],
    controllers: [AuthController],
})
export class AuthModule { }
