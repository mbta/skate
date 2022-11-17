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

FROM node:14-alpine3.15 as assets-builder

WORKDIR /root
ADD . .

# Copy in elixir deps required to build node modules for phoenix
COPY --from=elixir-builder /root/deps ./deps

RUN npm --prefix assets ci
RUN npm --prefix assets run deploy

FROM elixir-builder as app-builder

ENV LANG="C.UTF-8" MIX_ENV=prod

RUN apk add --no-cache --update curl

WORKDIR /root

RUN curl https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
    -o aws-cert-bundle.pem
RUN echo "4ce3510fcdc7ebd281c45a7f9dfafe3354acd0f504cf7ca35afbbc956b7ed06c  aws-cert-bundle.pem" | sha256sum -c -

# Add frontend assets compiled in node container, required by phx.digest
COPY --from=assets-builder /root/priv/static ./priv/static

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
