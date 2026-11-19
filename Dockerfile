# StepLab as a Docker image: the built website, served by nginx.
#
#   docker build -t steplab .
#   docker run --rm -p 8080:8080 steplab            → http://localhost:8080
#
# Your own labs, without rebuilding:
#   docker run --rm -p 8080:8080 -v "$PWD/my-labs:/usr/share/nginx/html/my-labs:ro" steplab
#   → http://localhost:8080/?lab=my-labs/your-lab.md

# ---- Stage 1: test and build the app with Node.js ----
FROM node:22-alpine AS build
WORKDIR /app

# Install packages first, so Docker can reuse this layer when only the code changes.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the code, run the tests, then build the static site into dist/.
COPY . .
RUN npm test && npm run build

# ---- Stage 2: serve the built files with nginx (no Node.js in the final image) ----
# The "unprivileged" nginx image runs as a normal user and listens on port 8080.
FROM nginxinc/nginx-unprivileged:stable-alpine

LABEL org.opencontainers.image.title="StepLab" \
      org.opencontainers.image.description="Codelab-style labs from Markdown" \
      org.opencontainers.image.source="https://github.com/sdkdeepa/steplab" \
      org.opencontainers.image.licenses="MIT"

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# Lets Docker and Kubernetes know when StepLab is up.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
