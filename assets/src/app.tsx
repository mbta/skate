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
import "@babel/polyfill"
import "phoenix_html"
import * as React from "react"
import ReactDOM from "react-dom"
import AppStateWrapper from "./components/appStateWrapper"

if (window.FS && window.userInfo) {
  window.FS.identify(window.userInfo.id, {
    displayName: window.userInfo.username,
  })
}

// Import local files
//
// Local files can be imported directly using relative paths, for example:
// import socket from "./socket"

ReactDOM.render(<AppStateWrapper />, document.getElementById("app"))
