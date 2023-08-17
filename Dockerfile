FROM hexpm/elixir:1.13.3-erlang-24.3.2-alpine-3.15.0 AS elixir-builder

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

FROM node:20.5.1-alpine3.17 as assets-builder

WORKDIR /root
ADD . .

# Copy in elixir deps required to build node modules for phoenix
COPY --from=elixir-builder /root/deps ./deps

# Build dependencies in case certain packages don't have prebuild binaries
RUN apk add --no-cache --update python3 build-base

RUN npm --prefix assets ci
RUN npm --prefix assets run deploy

FROM elixir-builder as app-builder

ENV LANG="C.UTF-8" MIX_ENV=prod

RUN apk add --no-cache --update curl

WORKDIR /root

RUN curl https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
    -o aws-cert-bundle.pem
RUN echo "2c151768edd48e9ef6719de74fdcbdebe290d1e87bc02ce9014ea6eea557d2a0  aws-cert-bundle.pem" | sha256sum -c -

# Add frontend assets compiled in node container, required by phx.digest
COPY --from=assets-builder /root/priv/static ./priv/static
ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=${SENTRY_RELEASE}

RUN mix do compile --force, phx.digest, release

FROM alpine:3.15.4

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

EXPOSE 4000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run the application
CMD ["bin/skate", "start"]
