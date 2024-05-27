# syntax=docker/dockerfile:1

# Base image and arguments
ARG NODE_VERSION=20.13.1
FROM node:${NODE_VERSION}-alpine as base

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
