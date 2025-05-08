import { Controller, Get, Post, Req, Res, UseGuards, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { LoginDto, AuthenticatedUser, VerifyOtpDto } from './dto/auth.dto';
import { MagicLoginAuthStrategy } from './magin-login.strategy'; // Import the NestJS strategy class
import { AuthService } from './auth.service'; // Import AuthService

@Controller('auth')
export class AuthController {
    constructor(
        private readonly magicLoginStrategy: MagicLoginAuthStrategy,
        private readonly authService: AuthService, // Inject AuthService
    ) { }

    @Post('magiclogin')
    // Removed @UseGuards(AuthGuard('magiclogin')) from the POST route
    async login(@Req() req: Request, @Res() res: Response, @Body() _loginDto: LoginDto) {
        // Call the send method from the injected strategy instance
        // The strategy's send method will process the body and call sendMagicLink
        this.magicLoginStrategy.send(req, res, (err) => {
            if (err) {
                // Handle errors during the send process
                return res.status(500).send({ success: false, message: err.message });
            }
            console.log(res);
            // The send method handles sending the email, so we just send a success response here
            res.send({ success: true, message: 'Check your email for the login link.' });
        });
    }

    @Get('magiclogin/callback')
    @UseGuards(AuthGuard('magic-login')) // Keep AuthGuard on the GET callback route
    async callback(@Req() req: Request & { user: AuthenticatedUser; }, @Res() res: Response) {
        console.log(req);
        // At this point, req.user is populated by the AuthGuard after successful verification
        res.send({ success: true, message: 'Logged in successfully', user: req.user });
    }

    // OTP Endpoints
    @Post('otp/send')
    @HttpCode(HttpStatus.OK)
    async sendOtp(@Body() loginDto: LoginDto) {
        // We only need the destination from LoginDto for sending OTP
        return this.authService.generateAndSendOtp(loginDto.destination);
    }

    @Post('otp/verify')
    @HttpCode(HttpStatus.OK)
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        const user = await this.authService.verifyOtp(verifyOtpDto.destination, verifyOtpDto.otp);
        // User is validated, now generate JWT
        const token = await this.authService.loginWithJwt(user);
        return { success: true, message: 'OTP verified successfully. Logged in.', ...token };
    }
}
