import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import { AuthenticatedUser } from './dto/auth.dto';
import { randomBytes } from 'crypto';

// Simulate a user store for otpUserSecret
const userOtpSecrets = new Map<string, string>();

@Injectable()
export class AuthService {
    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private configService: ConfigService,
        private jwtService: JwtService,
    ) { }

    private getOtpCacheKey(destination: string): string {
        return `otp:${destination}`;
    }

    async generateAndSendOtp(destination: string): Promise<{ message: string; }> {
        const user = await this.validateUserByEmail(destination);
        if (!user || !user.otpUserSecret) {
            console.error(`User or OTP secret not found for ${destination}`);
            throw new HttpException('User not found or OTP setup incomplete.', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        const otpExpirySecondsStr = this.configService.get<string>('OTP_EXPIRY_SECONDS', '300');
        const otpDigitsStr = this.configService.get<string>('OTP_LENGTH', '6');

        const otpDigits = parseInt(otpDigitsStr, 10);
        const otpExpirySeconds = parseInt(otpExpirySecondsStr, 10);

        // Set options before generating
        authenticator.options = {
            digits: otpDigits,
            step: otpExpirySeconds,
        };
        const otp = authenticator.generate(user.otpUserSecret);

        console.log(`[AuthService] Caching OTP for ${destination}. Key: ${this.getOtpCacheKey(destination)}, OTP: ${otp}, Expiry (s): ${otpExpirySeconds}`);
        try {
            // Convert otpExpirySeconds to milliseconds for cacheManager.set
            const res = await this.cacheManager.set(this.getOtpCacheKey(destination), otp, otpExpirySeconds * 1000);
            console.log("response for redis", res);
            console.log(`[AuthService] OTP successfully cached for ${destination}.`);
        } catch (error) {
            console.error(`[AuthService] Error caching OTP for ${destination}:`, error);
            throw new HttpException('Failed to store OTP.', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Simulate sending OTP via email
        console.log(`Simulating sending OTP ${otp} to ${destination}`);
        // In a real application, integrate an email service here.

        return { message: `OTP sent to ${destination}. It will expire in ${otpExpirySeconds / 60} minutes.` };
    }

    async verifyOtp(destination: string, providedOtp: string): Promise<AuthenticatedUser> {
        const otpCacheKey = this.getOtpCacheKey(destination);
        console.log(`[AuthService] Verifying OTP for ${destination}. Cache Key: ${otpCacheKey}, Provided OTP: ${providedOtp}`);
        let storedOtp: string | null | undefined; // Adjusted type here
        try {
            storedOtp = await this.cacheManager.get<string>(otpCacheKey);
            console.log(`[AuthService] Retrieved from cache for ${destination}:`, storedOtp);
        } catch (error) {
            console.error(`[AuthService] Error retrieving OTP from cache for ${destination}:`, error);
            throw new HttpException('Failed to retrieve OTP from cache.', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        if (!storedOtp) {
            console.warn(`[AuthService] OTP not found in cache for ${destination} or expired.`);
            throw new HttpException('OTP expired or not found.', HttpStatus.BAD_REQUEST);
        }

        const user = await this.validateUserByEmail(destination);
        if (!user || !user.otpUserSecret) {
            console.error(`User or OTP secret not found for ${destination} during verification.`);
            throw new HttpException('User not found or OTP setup incomplete for verification.', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        const otpExpirySecondsStr = this.configService.get<string>('OTP_EXPIRY_SECONDS', '300');
        const otpDigitsStr = this.configService.get<string>('OTP_LENGTH', '6');

        const otpDigits = parseInt(otpDigitsStr, 10);
        const otpExpirySeconds = parseInt(otpExpirySecondsStr, 10);


        // Set options before verifying
        authenticator.options = {
            digits: otpDigits,
            step: otpExpirySeconds,
        };
        const isValid = authenticator.verify({ token: providedOtp, secret: user.otpUserSecret });

        if (!isValid || storedOtp !== providedOtp) { // Double-check with stored value
            throw new HttpException('Invalid OTP.', HttpStatus.BAD_REQUEST);
        }

        await this.cacheManager.del(otpCacheKey); // OTP used, delete it
        return user; // Return the full user object
    }

    async sendMagicLink(destination: string, href: string): Promise<void> {
        // Implement your email logic here
        console.log(`Simulating sending magic link to ${destination}: ${href}`);
        // In a real application, you would use a service like nodemailer, Mailgun, etc.
        return Promise.resolve();
    }

    async validateUserByEmail(email: string): Promise<AuthenticatedUser> {
        // Simulate user lookup/creation and OTP secret management
        console.log(`Validating or creating user with email: ${email}`);
        let otpUserSecret = userOtpSecrets.get(email);
        if (!otpUserSecret) {
            otpUserSecret = randomBytes(20).toString('hex'); // Generate a new secret
            userOtpSecrets.set(email, otpUserSecret); // "Store" it
            console.log(`Generated new OTP secret for ${email}`);
        }
        // In a real application, this would interact with your database.
        return { id: Date.now(), email, otpUserSecret };
    }

    async loginWithJwt(user: AuthenticatedUser): Promise<{ accessToken: string; }> {
        const payload = { email: user.email, sub: user.id };
        return {
            accessToken: await this.jwtService.signAsync(payload),
        };
    }
}
