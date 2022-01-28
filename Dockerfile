FROM hexpm/elixir:1.10.2-erlang-22.3.4.23-alpine-3.13.6 AS elixir-builder

# elixir expects utf8.
ENV ELIXIR_VERSION="v1.10.2" \
  LANG=C.UTF-8 \
  MIX_ENV=prod

WORKDIR /root
# Install git so we can install dependencies from GitHub
RUN apk add --no-cache --update git

# Install Hex+Rebar
RUN mix local.hex --force && \
  mix local.rebar --force

COPY mix.exs mix.exs
COPY mix.lock mix.lock
COPY config/config.exs config/
COPY config/prod.exs config/

RUN mix do deps.get --only $MIX_ENV && mix deps.compile

FROM node:14-alpine3.13 as assets-builder

WORKDIR /root

# Needed for uploading source maps during front-end build
ARG SENTRY_ORG=$SENTRY_ORG
ARG SENTRY_PROJECT=$SENTRY_PROJECT
ARG SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ARG AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY

# Copy in elixir deps required to build node modules for phoenix
COPY --from=elixir-builder /root/deps ./deps

COPY assets/package.json assets/
COPY assets/package-lock.json assets/

RUN npm --prefix assets ci

COPY assets/ assets/

RUN npm --prefix assets run deploy

FROM elixir-builder as app-builder

ENV LANG="C.UTF-8" MIX_ENV=prod

WORKDIR /root

COPY lib lib
COPY data data

RUN mix do compile --force

# Add frontend assets compiled in node container, required by phx.digest
COPY --from=assets-builder /root/priv/static ./priv/static

RUN mix phx.digest

COPY rel rel
COPY config/releases.exs config/

RUN mix release

FROM alpine:3.13.6

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
