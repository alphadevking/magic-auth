# Magic Auth

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
<!-- Add other badges here if you have them, e.g., build status, coverage -->

A NestJS starter project demonstrating magic link authentication using `passport-magic-login`.

## Description

This project demonstrates two passwordless authentication methods using NestJS:

1.  **Magic Link:** Users request a link via email. Clicking this link (containing a short-lived token) authenticates them. Implemented using `passport-magic-login`.
2.  **OTP Verification:** Users request an OTP via email. They then submit this OTP to verify their identity. Implemented using `otplib` and Redis caching.

Both successful flows result in the issuance of a standard JWT for session management.

## Key Features

*   **Magic Link Authentication:** Secure, one-click login via email links.
*   **OTP Authentication:** Time-based One-Time Password generation and verification.
*   **JWT Sessions:** Standard JWT issuance upon successful authentication.
*   **Redis Caching:** Uses Redis via `@nestjs/cache-manager` and `@keyv/redis` for storing OTPs temporarily.
*   **Docker Support:** Includes `Dockerfile` and `.dockerignore` for containerization.
*   Built with [NestJS](https://nestjs.com/), a progressive Node.js framework.

## Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended - see `Dockerfile` for specific version)
*   [pnpm](https://pnpm.io/)
*   A running Redis instance (local or cloud-based).
*   [Docker](https://www.docker.com/) (Optional, for running with Docker)

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

Create a `.env` file in the root of the project. You can copy `.env.example` if it exists, or create it manually with the following variables:

```env
# Application Port
PORT=3252

# Magic Link Strategy Configuration
# Used by passport-magic-login to sign the link token
MAGIC_LINK_SECRET=your-very-strong-and-unique-secret-for-magic-link

# Redis Configuration (for OTP caching)
# Example for local Redis: REDIS_URL=redis://localhost:6379
# Example for Redis Cloud (replace with your actual credentials):
REDIS_URL=redis://default:your_password@your_redis_host.com:port

# OTP Configuration
OTP_SECRET=your-very-strong-and-unique-secret-for-otp # Used by otplib to generate/verify OTPs
OTP_EXPIRY_SECONDS=300 # How long the OTP is valid (in seconds)
OTP_LENGTH=6 # Number of digits for the OTP

# JWT Configuration (for session tokens)
JWT_SECRET=your-very-strong-and-unique-secret-for-jwt # Used to sign session JWTs
JWT_EXPIRY=3600s # How long the session JWT is valid (e.g., 3600s = 1 hour)
```

**Important:**
*   Replace placeholder values (like `your-very-strong...`, `your_password`, `your_redis_host.com:port`) with your actual secret keys and connection details.
*   Keep your `.env` file secure and **do not commit it to version control** if it contains sensitive information.
*   The `REDIS_URL` is crucial for the OTP functionality to work correctly.

### 4. Running the Application

```bash
# Development mode (with watch)
pnpm run start:dev

# Production mode
pnpm run start:prod

# Debug mode
pnpm run start:debug
```

The application will start on the port specified by the `PORT` environment variable (e.g., `http://localhost:3252` if `PORT=3252`).

## Running with Docker (Optional)

1.  **Ensure Docker is running.**
2.  **Build the Docker image:**
    ```bash
    docker build -t magic-auth-app .
    ```
3.  **Run the container:**
    Make sure your `.env` file is configured correctly in the project root directory.
    ```bash
    # Run in detached (background) mode
    docker run --env-file .env -p [YOUR_HOST_PORT]:[CONTAINER_PORT] --name magic-auth-container -d magic-auth-app

    # Example using the PORT from .env (3252):
    docker run --env-file .env -p 3252:3252 --name magic-auth-container -d magic-auth-app
    ```
    *   Replace `[YOUR_HOST_PORT]` with the port you want to access the app on your machine.
    *   Replace `[CONTAINER_PORT]` with the `PORT` value set in your `.env` file (e.g., 3252).
    *   The `--env-file .env` flag injects your environment variables into the container.
    *   `-d` runs the container in the background. Omit it to see logs directly.

    You can then access the application at `http://localhost:[YOUR_HOST_PORT]`.

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
    *   **Response (Success):** Issues a standard JWT access token.
        ```json
        {
          "success": true,
          "message": "Logged in successfully",
          "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
        ```
        *(Note: The actual response structure might vary based on how you handle the final JWT issuance after the guard passes).*

*   **`POST /auth/otp/send`**
    *   Initiates the OTP login process by generating and sending an OTP.
    *   **Request Body:** Expects an email address.
        ```json
        {
          "destination": "user@example.com"
        }
        ```
    *   **Response:** Confirms OTP sending.
        ```json
        {
          "message": "OTP sent to user@example.com. It will expire in 5 minutes."
        }
        ```

*   **`POST /auth/otp/verify`**
    *   Verifies the submitted OTP for a given email.
    *   **Request Body:** Expects the email and the OTP.
        ```json
        {
          "destination": "user@example.com",
          "otp": "123456"
        }
        ```
    *   **Response (Success):** Issues a standard JWT access token.
        ```json
        {
          "success": true,
          "message": "OTP verified successfully. Logged in.",
          "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
        ```
    *   **Response (Failure):** Indicates an invalid or expired OTP.

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

When deploying your NestJS application, refer to the official [NestJS deployment documentation](https://docs.nestjs.com/deployment) for best practices. Using the provided Dockerfile is a recommended approach for creating consistent deployment artifacts. Ensure your production environment variables (especially secrets like `MAGIC_LINK_SECRET`, `OTP_SECRET`, `JWT_SECRET`, and `REDIS_URL` with credentials) are securely managed (e.g., using environment variables provided by your hosting platform or a secret management system) and **not** hardcoded or committed in the `.env` file used for deployment builds.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
(You can add more specific contribution guidelines if you have them).

## Author

*   **Favour Orukpe**
    *   GitHub: [@alphadevking](https://github.com/alphadevking)

## License

This project is [MIT licensed](LICENSE.md).
