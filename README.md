# Skate

Skate is a web-based dispatch tool for bus inspectors, built by the MBTA. Imagine an app that helps you track the one bus you want to catch, but instead it’s helping us track all the buses that everyone wants to catch! It has the rich location data driving our mbta.com and rider apps, but also info that matters for keeping things running smoothly (operator names, bus numbers, shift schedules). For background, read our [“Skate: Building a better bus dispatch app (and how it will improve your ride)”](https://medium.com/mbta-tech/skate-building-a-better-bus-dispatch-app-and-how-it-will-improve-your-ride-51965d8ef7b9) blog post.

![Animated Skate screenshot](https://miro.medium.com/max/1024/1*zuUAIdkDfYRFEDscP9qHOg.gif)

## Community

The MBTA Customer Technology Department supports a shared Slack channel that transit agencies and partners adapting the Skate code can use to collaborate and ask questions. To be invited to the Slack channel, email [developer@mbta.com](mailto:developer@mbta.com).

## Setup

Doing development on Skate requires Elixir, Erlang, and node, as dsecribed in [.tool-versions](https://github.com/mbta/skate/blob/master/.tool-versions). Most developers use [asdf](https://asdf-vm.com/) to help manage the required versions, but that isn't required.

Skate also requires Postgres. If you don't already have Postgres installed, and you're on a Mac, [Postgres.app](https://postgresapp.com/downloads.html) is an easy way to get started. However, any Postgres instance to which you can connect and in which you have sufficient privileges should work.

Secrets and other application settings are passed in via environment variables. To avoid having to set these manually in your local development environment, [direnv](https://direnv.net/) is strongly recommended. A `.envrc.example` file is provided to fill out; simply copy it over to `.envrc` and fill in the values, then follow the direnv documentation to load it.

Quick setup:

1. Install languange dependencies with `asdf install`
1. Install Elixir dependencies with `mix deps.get`
1. Install Node.js dependencies with `cd assets && npm install`
1. Install Postgres by your favorite method, possibly by downloading the latest install image from the [Postgres.app download page](https://postgresapp.com/downloads.html), opening it, and copying the Postgres.app application into Applications.
1. To create the database, back in the Terminal, `` mix ecto.create && mix ecto.migrate ``

## Running the application

- Start Phoenix endpoint with `` mix phx.server ``
- Visit [`localhost:4000`](http://localhost:4000) from your browser.

## Running tests

- Run Elixir tests with `` mix test ``
- Run Javascript tests with `cd assets && npm test`

## Configuring to run in a new environment

There are a number of configuration details defined in environment variables. These define where data sources live, as well as authentication and CDN details. In our AWS environments these are all set and managed via Terraform.

- **API_URL**: URL of the API for retrieving live train positions
- **API_KEY**: Access key for the API
- **GTFS_URL**: Location of the GTFS zip file
- **BUSLOC_URL**: Source of GTFS-realtime enhanced VehiclePositions json data file
- **POSTGRES_USERNAME**, **POSTGRESS_PASSWORD**, **POSTGRES_HOSTNAME**: Postgres username, password, and hostname
- **SWIFTLY_AUTHORIZATION_KEY**: for dev only, see below for prod
- **SWIFTLY_REALTIME_VEHICLES_URL**: Source of Swiftly vehicle data
- **TRIP_UPDATES_URL**: Source of GTFS-realtime enhanced TripUpdates json data file (optional)
- **ERL_FLAGS**: Erlang/OTP settings, pass "+MIscs 2048" to allocate enough memory for literals in your local dev environment
- **SKATE_HASTUS_URL**: Source of extended schedule data
- **ENVIRONMENT_NAME**: The first part of the key names in SecretsManager (only required in production)
- **RELEASE_COOKIE**: Used by Erlang (only required in production)
- **COGNITO_DOMAIN**, **COGNITO_CLIENT_ID**, **COGNITO_CLIENT_SECRET**, **COGNITO_USER_POOL_ID**, **COGNITO_AWS_REGION**, and **GUARDIAN_SECRET_KEY**: Authentication/authorization details (only required in production)
- **STATIC_SCHEME**, **STATIC_HOST**, **STATIC_PATH**, and **STATIC_PORT**: CDN details (only required in production)
- **SENTRY_BACKEND_DSN**, **SENTRY_FRONTEND_DSN**: Endpoints for logging errors to Sentry (optional, only used in production)
- **BRIDGE_URL**: URL of the API for retrieving drawbridge status
- **BRIDGE_API_USERNAME**, **BRIDGE_API_PASSWORD**: credentials for the API that gets drawbridge status
- **GUARDIAN_SECRET_KEY**: Authentication/authorization secret
- **SECRET_KEY_BASE**: Used for writing encrypted cookies. Generate a value using `mix phx.gen.secret` (only required in production)

## Production Deploys

Prior to releasing a new version to prod, we create an annotated Git tag documenting what's being deployed. The tag name should be in the format `YYYY-MM-DD-N`, where `N` is used to differentiate between multiple releases in a given day and starts at 1. For the body of the description, run the following command:
```
git log --abbrev-commit --pretty=format:'%h:%s' [hash of previous prod version]..HEAD
```
Then run:
```
git tag -a [tag name]
```
which will prompt you to enter the annotation from the previous step via your editor. Once this is done, you can push using:
```
git push origin --tags
```
Once this is complete, initiate the deploy through GitHub Actions.
