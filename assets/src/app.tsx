// We need to import the CSS so that webpack will load it.
// The MiniCssExtractPlugin is used to separate it out into
// its own CSS file.
declare function require(name: string): string
// tslint:disable-next-line
require("../css/app.scss")

// webpack automatically bundles all modules in your
// entry points. Those entry points can be configured
// in "webpack.config.js".
//
// Import dependencies
//
import * as Sentry from "@sentry/react"
import "core-js/stable"
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css" // see https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699
import "leaflet/dist/leaflet.css"
import "phoenix_html"
import * as React from "react"
import ReactDOM from "react-dom"
import ResizeObserver from "resize-observer-polyfill"
import AppStateWrapper from "./components/appStateWrapper"

if (window.sentry) {
  Sentry.init({
    dsn: window.sentry.dsn,
  })

  if (window.username) {
    Sentry.setUser({ username: window.username })
  }
}

if (window.FS && window.username) {
  window.FS.identify(window.username, { displayName: window.username })
}

if (!("ResizeObserver" in global)) {
  // Load polyfill for https://github.com/rehooks/component-size
  window.ResizeObserver = ResizeObserver
}

// Import local files
//
// Local files can be imported directly using relative paths, for example:
// import socket from "./socket"

ReactDOM.render(<AppStateWrapper />, document.getElementById("app"))
