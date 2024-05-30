# syntax=docker/dockerfile:1

# Base image
FROM ubuntu:20.04 as base

# Arguments for build time
ARG NODE_VERSION=20.x
ARG DEBIAN_FRONTEND=noninteractive

# Set environment variables
ENV TZ=Etc/UTC

# Install dependencies
RUN apt-get update && \
    apt-get install -y \
    curl \
    gnupg \
    unzip \
    python3 \
    python3-pip \
    awscli \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -sL https://deb.nodesource.com/setup_${NODE_VERSION} | bash - && \
    apt-get install -y nodejs

# Install Yarn
RUN npm install --global yarn

# Set the working directory
WORKDIR /usr/src/app

# Copy dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Expose the application port
EXPOSE 3000

# Add AWS CLI configuration script
COPY configure-aws-cli.sh /usr/local/bin/configure-aws-cli.sh
RUN chmod +x /usr/local/bin/configure-aws-cli.sh

# Set build arguments for AWS credentials
ARG AWS_ACCESS_KEY
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_REGION

# Configure AWS CLI with environment variables
RUN /usr/local/bin/configure-aws-cli.sh


# Development stage
FROM base as dev

# Copy application files
COPY . .
# Build application
RUN npm run build
# Start the application in development mode
CMD ["npm", "run", "start:dev"]


# Production stage
FROM base as prod
# Install only production dependencies
RUN npm install --omit=dev
# Copy application files
COPY . .
# Copy dist from dev stage
COPY --from=dev /usr/src/app/dist ./dist
# Start the application in production mode
CMD ["node", "dist/main"]


# Test stage
FROM base as test
ENV NODE_ENV=test
# Install dependencies
RUN --mount=type=bind,source=yarn.lock,target=yarn.lock \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install
# Copy application files
COPY . .
# Run tests
CMD ["npm", "run", "test"]
