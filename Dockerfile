# syntax=docker/dockerfile:1

# Base image and arguments
ARG NODE_VERSION=20.13.1
FROM node:${NODE_VERSION}-alpine as base

# Install python3, venv, and other dependencies
RUN apk add --no-cache python3 py3-pip py3-virtualenv bash

# Create a virtual environment for the AWS CLI
RUN python3 -m venv /opt/aws-cli-env && \
    . /opt/aws-cli-env/bin/activate && \
    pip install --upgrade pip && \
    pip install awscli

# Set the working directory
WORKDIR /usr/src/app

# Copy dependencies
COPY package*.json ./

# Expose the application port
EXPOSE 3000

# Development stage
FROM base as dev

# Install dependencies
RUN npm install

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

# Add AWS CLI configuration script
COPY configure-aws-cli.sh /usr/local/bin/configure-aws-cli.sh
RUN chmod +x /usr/local/bin/configure-aws-cli.sh

# Set build arguments for AWS credentials
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_DEFAULT_REGION

# Configure AWS CLI with environment variables
RUN /usr/local/bin/configure-aws-cli.sh

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
CMD ["node", "run", "test"]
