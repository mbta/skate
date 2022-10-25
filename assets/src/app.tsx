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
import "leaflet/dist/leaflet.css"
import "phoenix_html"
import * as React from "react"
import { createRoot } from "react-dom/client"
import sentryInit from "./helpers/sentryInit"
import AppStateWrapper from "./components/appStateWrapper"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import clarityInit from "./helpers/clarityInit"
import clarityIdentify from "./helpers/clarityIdentify"
import { tagManagerIdentify } from "./helpers/googleTagManager"

const username = document
  .querySelector("meta[name=username]")
  ?.getAttribute("content")

sentryInit(window.sentry, username || undefined)

const clarityTag = document
  .querySelector("meta[name=clarity-tag]")
  ?.getAttribute("content")

if (clarityTag) {
  clarityInit(clarityTag)
}

const userUuid = document
  .querySelector("meta[name=user-uuid]")
  ?.getAttribute("content")

clarityIdentify(window.clarity, userUuid)

tagManagerIdentify(userUuid)

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById("app")!)
root.render(<AppStateWrapper />)
