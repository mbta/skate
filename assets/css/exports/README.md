# CSS Exports
## Purpose
This folder contains `scss` modules which are importable by the webpack pipeline `sass-loader |> style-loader |> css-loader`.
These files exist to allow `scss` to be the source of truth for variables, and other systems to interface with the variables exported in these modules.

## `module.scss` suffix and `:export`
For webpack to be able to import items from an `scss` file, this file must have the following suffix: `.module.scss`.
Additionally, to access any variables within the file, the file must have a `:export` block, which declares properties to expose when imported by webpack.

