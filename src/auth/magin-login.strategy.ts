import { Injectable } from '@nestjs/common';
import { PassportStrategy } from "@nestjs/passport";
import MagicLoginStrategy from "passport-magic-login";
import { AuthService } from './auth.service';

@Injectable()
export class MagicLoginAuthStrategy extends PassportStrategy(
  MagicLoginStrategy as any,
  'magic-login'
) {
  constructor(private authService: AuthService) {
    super({
      // Used to encrypt the authentication token. Needs to be long, unique and (duh) secret.
      secret: process.env.MAGIC_LINK_SECRET!,

      // The authentication callback URL
      callbackUrl: "/auth/magiclogin/callback",

      // Called with the generated magic link so you can send it to the user
      // "destination" is what you POST-ed from the client
      // "href" is your confirmUrl with the confirmation token,
      // for example "/auth/magiclogin/confirm?token=<longtoken>"
      sendMagicLink: async (destination, href) => {
        await this.authService.sendMagicLink(destination, `http://localhost:3252${href}`);
      },

      // Once the user clicks on the magic link and verifies their login attempt,
      // you have to match their email to a user record in the database.
      // If it doesn't exist yet they are trying to sign up so you have to create a new one.
      // "payload" contains { "destination": "email" }
      // In standard passport fashion, call callback with the error as the first argument (if there was one)
      // and the user data as the second argument!
      verify: (payload, callback) => {
        // Get or create a user with the provided email from the database
        this.authService.validateUserByEmail(payload.destination)
          .then(user => {
            callback(null, user);
          })
          .catch(err => {
            callback(err);
          });
      }, // Added comma here

      // Optional: options passed to the jwt.sign call (https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback)
      jwtOptions: {
        expiresIn: "20s",
      }, // Added comma here
    });
  }

  async validate(payload: any, done: (error: any, user?: any) => void): Promise<void> {
    // The 'verify' function above handles the user lookup/creation.
    // The payload here is the result of the 'verify' function.
    // If 'verify' called callback(null, user), payload will be the user object.
    // If 'verify' called callback(err), payload will be null.
    console.log(payload);
    if (!payload) {
      return done(null, false);
    }
    done(null, payload);
  }
}
