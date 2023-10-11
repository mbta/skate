// We need to import the CSS so that webpack will load it.
// The MiniCssExtractPlugin is used to separate it out into
// its own CSS file.
declare function require(name: string): string
require("../css/app.scss")

// webpack automatically bundles all modules in your
// entry points. Those entry points can be configured
// in "webpack.config.js".
//
// Import dependencies
//
import "core-js/stable"
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css" // see https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699
import "phoenix_html"
import * as React from "react"
import { createRoot } from "react-dom/client"
import sentryInit from "./helpers/sentryInit"
import AppStateWrapper from "./components/appStateWrapper"
import { tagManagerIdentify } from "./helpers/googleTagManager"
import { fullStoryInit } from "./helpers/fullStory"
import inTestGroup, { TestGroups } from "./userInTestGroup"

document.documentElement.dataset.demoMode = inTestGroup(
  TestGroups.DemoMode
).toString()

const username = document
  .querySelector("meta[name=username]")
  ?.getAttribute("content")

fullStoryInit(window.fullStoryInitialization?.organizationId, username)

sentryInit(
  window.sentryInitialization?.initArgs,
  username || undefined,
  window.sentryInitialization?.orgSlug
)

const userUuid = document
  .querySelector("meta[name=user-uuid]")
  ?.getAttribute("content")

tagManagerIdentify(userUuid)

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById("app")!)
root.render(<AppStateWrapper />)
