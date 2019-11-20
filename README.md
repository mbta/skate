# Skate

Skate is a web-based dispatch tool for bus inspectors, built by the MBTA. Imagine an app that helps you track the one bus you want to catch, but instead it’s helping us track all the buses that everyone wants to catch! It has the rich location data driving our mbta.com and rider apps, but also info that matters for keeping things running smoothly (operator names, bus numbers, shift schedules). For background, read our [“Skate: Building a better bus dispatch app (and how it will improve your ride)”](https://medium.com/mbta-tech/skate-building-a-better-bus-dispatch-app-and-how-it-will-improve-your-ride-51965d8ef7b9) blog post.

![Animated Skate screenshot](https://miro.medium.com/max/1024/1*zuUAIdkDfYRFEDscP9qHOg.gif)

## Setup

- `asdf install`
- Install dependencies with `mix deps.get`
- Install Node.js dependencies with `cd assets && npm install`

## Running the application

- Start Phoenix endpoint with `` env `cat .env` mix phx.server `` (for bash. For fish use: `env (cat .env) mix phx.server`)
- Visit [`localhost:4000`](http://localhost:4000) from your browser.

## Running tests

- Run Elixir tests with `` env `cat .env` mix test `` (for bash. For fish use: `env (cat .env) mix test`)
- Run Javascript tests with `cd assets && npm test`

## Configuring to run in a new environment

There are a number of configuration details defined in environment variables. These define where data sources live, as well as authentication and CDN details. See `.env.example` for naming and syntax.

- **BUSLOC_URL**: Source of GTFS-realtime enhanced data file
- **SWIFTLY_REALTIME_VEHICLES_URL** and **SWIFTLY_AUTHORIZATION_KEY**: Source of Swiftly vehicle data
- **COGNITO_DOMAIN**, **COGNITO_CLIENT_ID**, **COGNITO_CLIENT_SECRET**, **COGNITO_USER_POOL_ID**, **COGNITO_AWS_REGION**, and **GUARDIAN_SECRET_KEY**: Authentication/authorization details (only required in production)
- **STATIC_SCHEME**, **STATIC_HOST**, **STATIC_PATH**, and **STATIC_PORT**: CDN details (only required in production)
