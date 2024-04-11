# Skate

Skate is a web-based dispatch tool for bus inspectors, built by the MBTA. Imagine an app that helps you track the one bus you want to catch, but instead it’s helping us track all the buses that everyone wants to catch! It has the rich location data driving our mbta.com and rider apps, but also info that matters for keeping things running smoothly (operator names, bus numbers, shift schedules). For background, read our [“Skate: Building a better bus dispatch app (and how it will improve your ride)”](https://medium.com/mbta-tech/skate-building-a-better-bus-dispatch-app-and-how-it-will-improve-your-ride-51965d8ef7b9) blog post.

![Animated Skate screenshot](https://miro.medium.com/max/1024/1*zuUAIdkDfYRFEDscP9qHOg.gif)

## Community

The MBTA Customer Technology Department supports a shared Slack channel that transit agencies and partners adapting the Skate code can use to collaborate and ask questions. To be invited to the Slack channel, email [developer@mbta.com](mailto:developer@mbta.com).

## Setup

### Prerequisites

Doing development on Skate requires Elixir, Erlang, and node, as described in [.tool-versions](https://github.com/mbta/skate/blob/main/.tool-versions). Most developers use [asdf](https://asdf-vm.com/) to help manage the required versions, but that isn't required.

Skate also requires Postgres. If you don't already have Postgres installed, and you're on a Mac, [Postgres.app](https://postgresapp.com/downloads.html) is an easy way to get started. However, any Postgres instance to which you can connect and in which you have sufficient privileges should work.

### Configuring to run in a new environment

There are a number of configuration details defined in environment variables. These define where data sources live, as well as authentication and CDN details. In our AWS environments these are all set and managed via Terraform.

To avoid having to set these manually in your local development environment, [direnv](https://direnv.net/) is strongly recommended. A [`.envrc.template` file](.envrc.template) is provided to fill out; simply copy it over to `.envrc.private` and fill in the values, then follow the [direnv documentation](https://direnv.net/#getting-started) to load it.

The environment variables are documented in the [Skate `.envrc.template` file](.envrc.template).

> [!NOTE]
> Some of these configuration values are shared between Skate team members.
> While there are still some values which are not shared and need to be configured in
> `.envrc.private`, to facilitate easier setup and to reduce the amount of work done when cloning
> for team members, the [`.envrc`](./.envrc) file is configured to source the shared
> configuration values from 1Password using the 
> [.env.1p.skate file](./.env.1p.skate) and the [1Password CLI](https://developer.1password.com/docs/cli/get-started/) (which you must also have on your system).

Here are the values you'll need to be prepared to update to run Skate locally:
* Your local Postgres server username and password
* Your personal API key from [MBTA Realtime API](https://api-v3.mbta.com/); request one if you don't have one
* API key from [Swiftly Transitime API](https://swiftly-inc.stoplight.io/docs/realtime-standalone/YXBpOjI4NDM2MDU3-swiftly-api-reference)

### Quick Setup

1. Install language dependencies with `asdf install`
1. Setup project with `mix setup`
	- This command will create the database, so you must first ensure your Postgres server is running and you've updated your credentials in `.envrc.private` as described in "Configuration" above.
1. (not necessary to run the application) 
	- The `test` command will automatically setup the database when run. 
	- You can setup the the testing database manually by running `mix ecto.setup` in the `test` envrionment 
		specified via `MIX_ENV`
		```
		$ MIX_ENV=test mix ecto.setup
		```
### Updating

After updating merged changes or checking out a new branch (e.g. to test a new feature), you may need to do the following to update the dependencies:

1. Update Elixir and Node.js dependencies at the same time by rerunning `mix setup`

___OR___

Update them independently with the following commands
1. Update Elixir dependencies with `mix deps.get`
1. Install Node.js dependencies with `cd assets && npm ci` 

## Running the application

- Start Phoenix endpoint with `` mix phx.server ``
- Visit [`localhost:4000`](http://localhost:4000) from your browser.

If you see the “data outage” banner when you open your local version of Skate, it means the software can’t get certain info, like crowding, which you need to be on the MBTA network for. Most features would work locally without network access.  

## Running tests

- Run Elixir tests with `` mix test ``
- Run Javascript tests with `cd assets && npm test`

## Running Storybook

Storybook is a tool to create and test UI components in isolation. To run: `cd assets && npm run storybook`

## Browser Support Policy

We strive to support all users – but the variety of browsers, operating systems and devices available necessitates a more intentioned approach. These differences could potentially cause bugs and harm your experience with Skate. Ensure you have the best possible experience with Skate by updating your browser to the latest version.

### Compatible Browsers

Generally speaking, Skate supports the stable latest releases of all major web browsers:
* Chrome (version 84+)
* Safari (version 14+)
* Firefox (version 78+)
* Microsoft Edge (version 84+)

Other interfaces using the underlying engines of the aforementioned browsers – that's WebKit, Blink, Gecko – are not explicitly supported but are expected to function correctly.
* Windows 10 - Edge
* Android - Chrome
* MacOS / iOS - Safari

### Incompatible Browsers

Skate does not work with:
* Internet Explorer
* Opera
* Developer or Beta versions of supported browsers

Use of Skate on these browsers will potentially lead to bugs and a poor experience with the app. We encourage you to use one of our compatible browsers instead.

## Team Conventions

### Editing Code

* Create each new feature in its own branch named with the following naming format: initials_description (for example, Jane Smith writing a search function might create a branch called JS_searchfunction)
* Before commiting changes, format Elixir code with ``mix format``
* Follow [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0-beta.2/) guidelines, by prefacing your commit message with one of the following structural elements: 
	* `feat:` (new feature for the user)
	* `fix:` (bugfix)
	* `chore:` (a housekeeping task; no visible change to user)
	* `docs`: (change to documentation)
	* `style`: (stylistic change, e.g. formatting of text)
	* `test`: (only updates automated tests)
* You can add as many commits as you'd like. If you use the "Squash & Commit" function when deploying to production, you will have the opportunity to consolidate them. 

### Code Review

All new features are required to be reviewed by a team member. To request a code review after checking in a new branch:
1. Create a pull request on your new branch. Edit the description to include a link to the Asana ticket describing the change.
1. New pull requests will automatically kick off testing. Wait for the tests to finish (about 10 minutes.)
1. Once all the the automated tests pass, request a review from a team member. Update the Asana ticket to "In Review."


## Development Deploys

### Merge Branch
When a new feature has passed review, you can merge the code to the main branch. Using the "Squash and Merge" button will give you the opportunity to consolidate multiple branch commits with one message. 

Delete the branch after merging has completed.

### Deploy to Skate-Dev
After merging, using Github Actions or the button in your email, approve and deploy to dev (process takes about 10 minutes.) If the deploy ran successfully, update the Asana ticket to "To be released to prod."

New changes can now be found on [Skate dev](https://skate-dev.mbtace.com). 

We normally allow a day or two before deploying to prod to ensure everything looks good on dev and to give an opportunity to check for errors in the logfiles. 

### Optional: Deploy to Skate-Dev-Blue
Use Github Actions to deploy a specific branch to [Skate-Dev-Blue](https://skate-dev-blue.mbtace.com) to stage changes that are expected to have visible front-facing consequences. 


## Production Deploys

The deploy process is as follows:

### 1. Check that dev is in a good state

Check [skate-dev](https://skate-dev.mbtace.com) to ensure that it's in a good state. Also check the Sentry [skate-backend](https://mbtace.sentry.io/issues/?environment=dev&project=5303878&statsPeriod=14d) and [skate-frontend](https://mbtace.sentry.io/issues/?project=5303927&statsPeriod=14d) projects' `dev` environments to make sure there are no surprising errors.

If there are, remedy those before deploying.

### 2. Check Splunk and Sentry to get a baseline for production

For Splunk, start by loading [this search](https://mbta.splunkcloud.com/en-US/app/search/search?q=search%20index%3D%22skate-prod-application%22%20%22%5Berror%5D%22%20OR%20%22%5Bexit%5D%22%20OR%20%22%5Bwarning%5D%22&display.page.search.mode=smart&dispatch.sample_ratio=1&workload_pool=&earliest=-30m%40m&latest=now), and then exclude terms related to errors or warnings that seem to happen a lot (`Geonames` is a common culprit to ignore) until you see no results. This is your baseline search query.

For Sentry, check both the [skate-backend](https://mbtace.sentry.io/issues/?environment=production&project=5303878&statsPeriod=14d) and [skate-frontend](https://mbtace.sentry.io/issues/?environment=production&project=5303927&statsPeriod=14d) projects.

### 3. Actually perform the deploy

The simplest way to deploy is as follows:

1. Run the script `mix deploy.prod`. This will open a release page in the browser.
1. Click `Generate release notes`
  a. Double-check that the tag is correct and that the release notes reflect the PR's that had been merged since the last release.
1. Click `Publish release`
1. Approve the release. You can do this by navigating to the ["Deploy to Prod (ECS)" GitHub Action page](https://github.com/mbta/skate/actions/workflows/deploy-prod-ecs.yml), selecting the latest release (which should match the tag that you just created), and approving it. You also will have gotten an email that links directly to the release.
1. Watch it go! (This will take a while, so make sure you have a nice cup of coffee or beverage of your choice.)

### 4. Monitor the new version

Click around in [Skate](https://skate.mbta.com) and double-check that things still look like they're working, especially any pages or components that were updated.

Return to your Splunk query created in step 1. You should continue to see no new results.

In Sentry, check the [skate-backend](https://mbtace.sentry.io/issues/?environment=production&project=5303878&statsPeriod=14d) and [skate-frontend](https://mbtace.sentry.io/issues/?environment=production&project=5303927&statsPeriod=14d) projects again. You shouldn't see any new errors.

If you go a half hour without seeing any issues, then you're good to consider the deploy successful. Mark any Asana tickets associated with this release as completed.
