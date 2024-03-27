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

Prior to releasing a new version to prod, we create an annotated Git tag documenting what's being deployed. 

1. Find all the git commit logs since the last production update for the body of the description. This will be the output of the following command:
```
git log --abbrev-commit --pretty=format:'%h:%s' [tag name or hash of previous prod version]..HEAD
```
To find out the tag name of the [most recent production release](https://github.com/mbta/skate/releases):
```
git describe --tags --abbrev=0
```
Or, to run both commands as one line:
```
git log --abbrev-commit --pretty=format:'%h:%s' $(git describe --tags --abbrev=0)..HEAD
```
2. The tag name should be in the format `YYYY-MM-DD-N`, where `N` is used to differentiate between multiple releases in a given day and starts at 1. Create the tag with this command: 
```
git tag -a [tag name]
```
This will prompt you to enter the annotation from the previous step via your editor. 

3. Once this is done, you can push using:
```
git push origin --tags
```
4. In [Skate's GitHub Releases Page](https://github.com/mbta/skate/releases)
   1. Click the "[`Draft new release`](https://github.com/mbta/skate/releases/new)" button.
   2. Select the tag you just made.
   3. Click "`Generate release notes`" to auto-generate a description of the release.
   4. Click "`Publish Release`."
5. Deploy the created tag to `production` using the ["Deploy to Prod (ECS)" GitHub Action](https://github.com/mbta/skate/actions/workflows/deploy-prod-ecs.yml).
6. Mark the Asana Tickets related to the released PR's as completed.
7. Find the new changes live at [skate.mbta.com](https://skate.mbta.com)
