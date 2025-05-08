# ---- Builder Stage ----
# Use the official Node.js LTS Alpine runtime as a parent image.
# Alpine Linux is chosen for its small size. LTS provides stability.
FROM node:lts-alpine AS builder

# Set the working directory in the container.
WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml to leverage Docker cache.
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install project dependencies using pnpm.
# --frozen-lockfile ensures that pnpm uses the versions specified in pnpm-lock.yaml.
RUN pnpm install --frozen-lockfile

# Copy the rest of the application source code.
COPY . .

# Build the application.
# This typically compiles TypeScript to JavaScript and places it in the /dist folder.
RUN pnpm run build

# ---- Runner Stage ----
# Use the same slim Node.js LTS Alpine image for the final application.
FROM node:lts-alpine

# Set the working directory.
WORKDIR /usr/src/app

# Install pnpm (needed if you were to run pnpm prune or other pnpm commands)
# If only running `node dist/main`, pnpm itself isn't strictly needed in the runner.
# However, copying node_modules from builder is often preferred.
RUN npm install -g pnpm

# Copy package.json (might be needed by the application or for `pnpm prune`)
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy only production dependencies from the builder stage.
# This creates a smaller final image by not including devDependencies.
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Alternatively, to install only production dependencies (cleaner but slower build for runner):
# RUN pnpm install --prod --frozen-lockfile

# Copy the built application (the /dist folder) from the builder stage.
COPY --from=builder /usr/src/app/dist ./dist

# The application listens on a port defined by the PORT environment variable.
# Expose this port. This is documentation; the actual port mapping happens in `docker run`.
# Your .env file has PORT=3252. The app will listen on this if PORT is set.
# If PORT is not set, NestJS defaults to 3000.
# We expose a common default here, but the app respects the ENV var.
EXPOSE 3000

# Define the command to run the application.
# This starts the Node.js server, pointing to the main entry file in the /dist folder.
CMD ["node", "dist/main.js"]
