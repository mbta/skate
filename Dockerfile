FROM elixir:1.10-alpine as builder

# elixir expects utf8.
ENV ELIXIR_VERSION="v1.10.2" \
  LANG=C.UTF-8

WORKDIR /root

# Install git so we can install dependencies from GitHub
RUN apk add --no-cache --update git

# Install Hex+Rebar
RUN mix local.hex --force && \
  mix local.rebar --force

RUN apk add --update nodejs nodejs-npm

ARG SENTRY_ORG=$SENTRY_ORG
ARG SENTRY_PROJECT=$SENTRY_PROJECT
ARG SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ARG AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY

ENV MIX_ENV=prod

ADD . .

RUN mix do deps.get, deps.compile

WORKDIR /root/assets/
RUN npm ci && npm run deploy

WORKDIR /root
RUN mix do phx.digest, release

EXPOSE 4000

CMD ["/root/_build/prod/rel/skate/bin/skate", "start"]
