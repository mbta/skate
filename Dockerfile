FROM hexpm/elixir:1.10.2-erlang-22.3.2-alpine-3.13.1 as elixir-builder

# elixir expects utf8.
ENV ELIXIR_VERSION="v1.10.2" \
  LANG=C.UTF-8 \
  MIX_ENV=prod

WORKDIR /root
ADD . .

# Install git so we can install dependencies from GitHub
RUN apk add --no-cache --update git

# Install Hex+Rebar+deps
RUN mix local.hex --force && \
  mix local.rebar --force && \
  mix do deps.get --only prod

FROM node:14-alpine3.13 as assets-builder

WORKDIR /root
ADD . .

# Needed for uploading source maps during front-end build
ARG SENTRY_ORG=$SENTRY_ORG
ARG SENTRY_PROJECT=$SENTRY_PROJECT
ARG SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ARG AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY

# Copy in elixir deps required to build node modules for phoenix
COPY --from=elixir-builder /root/deps ./deps

RUN npm --prefix assets ci
RUN npm --prefix assets run deploy

FROM elixir-builder as app-builder

ENV LANG="C.UTF-8" MIX_ENV=prod

WORKDIR /root

# Add frontend assets compiled in node container, required by phx.digest
COPY --from=assets-builder /root/priv/static ./priv/static

RUN mix do compile --force, phx.digest, release

FROM alpine:3.13.1

RUN apk add --update libssl1.1 ncurses-libs bash curl dumb-init \
  && rm -rf /var/cache/apk

# Create non-root user
RUN addgroup -S skate && adduser -S -G skate skate
USER skate
WORKDIR /home/skate

# Set environment
ENV MIX_ENV=prod TERM=xterm LANG="C.UTF-8" PORT=4000 REPLACE_OS_VARS=true

# Add frontend assets with manifests from app-builder container
COPY --from=app-builder --chown=skate:skate /root/priv/static ./priv/static

# Add application artifact compiled in app-builder container
COPY --from=app-builder --chown=skate:skate /root/_build/prod/rel/skate .

EXPOSE 4000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run the application
CMD ["bin/skate", "start"]
