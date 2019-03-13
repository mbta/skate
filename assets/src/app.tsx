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
import "phoenix_html"
import * as React from "react"
import ReactDOM from "react-dom"

// Import local files
//
// Local files can be imported directly using relative paths, for example:
// import socket from "./socket"

function App(): JSX.Element {
  return <h2>Hello from React</h2>
}

ReactDOM.render(<App />, document.getElementById("app"))
