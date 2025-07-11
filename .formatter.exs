[
  import_deps: [:ecto, :ecto_sql, :phoenix],
  plugins: [Phoenix.LiveView.HTMLFormatter, DoctestFormatter],
  subdirectories: ["priv/repo/*migrations"],
  inputs: ["*.{heex,ex,exs}", "{config,lib,test}/**/*.{heex,ex,exs}", "priv/*/seeds.exs"]
]
