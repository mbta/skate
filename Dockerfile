FROM hexpm/elixir:1.17.2-erlang-26.1.2-alpine-3.17.9 AS elixir-builder

# elixir expects utf8.
ENV LANG=C.UTF-8 \
  MIX_ENV=prod

WORKDIR /root
ADD . .

# Install git so we can install dependencies from GitHub
RUN apk add --no-cache --update git

# Install Hex+Rebar+deps
RUN mix local.hex --force && \
  mix local.rebar --force && \
  mix do deps.get --only prod

FROM node:20.11.0-alpine3.19 AS assets-builder

WORKDIR /root
ADD . .

# Copy in elixir deps required to build node modules for phoenix
COPY --from=elixir-builder /root/deps ./deps

# Build dependencies in case certain packages don't have prebuild binaries
RUN apk add --no-cache --update python3 build-base

RUN npm --prefix assets ci
RUN npm --prefix assets run deploy

FROM elixir-builder AS app-builder

ENV LANG="C.UTF-8" MIX_ENV=prod

RUN apk add --no-cache --update curl

WORKDIR /root

ADD \
  --checksum=sha256:e5bb2084ccf45087bda1c9bffdea0eb15ee67f0b91646106e466714f9de3c7e3 \
  https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
  aws-cert-bundle.pem

# Add frontend assets compiled in node container, required by phx.digest
COPY --from=assets-builder /root/priv/static ./priv/static
ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=${SENTRY_RELEASE}

RUN mix do compile --force, phx.digest, sentry.package_source_code, release

FROM alpine:3.17.5

RUN apk upgrade --no-cache --update

RUN apk add --no-cache --update libssl1.1 libstdc++ \
    libgcc ncurses-libs bash curl dumb-init

# Create non-root user
RUN addgroup -S skate && adduser -S -G skate skate
WORKDIR /home/skate
USER skate

# Set environment
ENV MIX_ENV=prod TERM=xterm LANG="C.UTF-8" PORT=4000 REPLACE_OS_VARS=true

# Add frontend assets with manifests from app-builder container
COPY --from=app-builder --chown=skate:skate /root/priv/static ./priv/static

# Add application artifact compiled in app-builder container
COPY --from=app-builder --chown=skate:skate /root/_build/prod/rel/skate .

COPY --from=app-builder --chown=skate:skate /root/aws-cert-bundle.pem ./priv/aws-cert-bundle.pem

# Expose HTTP, EPMD, and Erlang RPC
EXPOSE 4000 4369 57195

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run the application
CMD ["bin/skate", "start"]
