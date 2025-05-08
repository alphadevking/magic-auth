# Magic Auth

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
<!-- Add other badges here if you have them, e.g., build status, coverage -->

A NestJS starter project demonstrating magic link authentication using `passport-magic-login`.

## Description

This project provides a backend implementation for a magic link authentication system. Users can request a login link to be sent to their email, and clicking this link will authenticate them into the application. It's built with the [NestJS](https://nestjs.com/) framework and leverages `passport-magic-login` for the core authentication strategy.

## Key Features

*   Passwordless, magic link authentication.
*   Built with NestJS, a progressive Node.js framework.
*   Uses `passport` and `passport-magic-login`.
*   Configurable JWT token expiration for magic links.

## Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [pnpm](https://pnpm.io/)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/alphadevking/magic-auth.git
cd magic-auth
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root of the project by copying the example:

```bash
cp .env.example .env
```

Then, update the `.env` file with your specific configurations:

**`.env.example`:**

```env
# Application Configuration
APP_BASE_URL=http://localhost:3001 # Base URL where the frontend/callback is hosted

# Magic Link Strategy Configuration
MAGIC_LINK_SECRET=your-very-strong-and-unique-secret-key # Used to encrypt the authentication token

# Email Configuration (adjust based on your AuthService implementation)
# These are placeholders; your AuthService will determine the exact variables needed.
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=user@example.com
EMAIL_PASS=your_email_password
EMAIL_FROM="Your App Name" <noreply@example.com> # Sender email address

# JWT Options (optional, defaults in strategy)
# JWT_EXPIRES_IN=15m # Example: 15 minutes
```

**Important:**
*   `MAGIC_LINK_SECRET` must be a long, unique, and secret string.
*   `APP_BASE_URL` should be the URL where your application is accessible and where the magic link callback will be handled (e.g., `http://localhost:3001` as seen in `magin-login.strategy.ts`).
*   Configure the `EMAIL_*` variables according to the email service provider you are using within your `AuthService` to send the magic links.

### 4. Running the Application

```bash
# Development mode (with watch)
pnpm run start:dev

# Production mode
pnpm run start:prod

# Debug mode
pnpm run start:debug
```

The application will typically start on `http://localhost:3000` (default NestJS port, unless configured otherwise).

## API Endpoints

The primary authentication endpoints are:

*   **`POST /auth/magiclogin`**
    *   Initiates the magic link login process.
    *   **Request Body:** Expects an email address for the user. Example:
        ```json
        {
          "destination": "user@example.com"
        }
        ```
        *(Note: The `LoginDto` in `src/auth/dto/auth.dto.ts` would define the exact structure. Assuming it includes `destination` for the email.)*
    *   **Response:** Confirms that the magic link has been sent.

*   **`GET /auth/magiclogin/callback`**
    *   The callback URL that the user is redirected to after clicking the magic link from their email.
    *   The `passport-magic-login` strategy handles token verification.
    *   **Response:** On success, typically returns user information and/or a session token/cookie.

## Running Tests

```bash
# Unit tests
pnpm run test

# Watch unit tests
pnpm run test:watch

# Test coverage
pnpm run test:cov

# End-to-end tests
pnpm run test:e2e
```

## Deployment

When deploying your NestJS application, refer to the official [NestJS deployment documentation](https://docs.nestjs.com/deployment) for best practices. Ensure your production environment variables (especially `MAGIC_LINK_SECRET` and email service credentials) are securely configured.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
(You can add more specific contribution guidelines if you have them).

## Author

*   **Favour Orukpe**
    *   GitHub: [@alphadevking](https://github.com/alphadevking)

## License

This project is [MIT licensed](LICENSE.md).
