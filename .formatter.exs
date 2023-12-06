[
  import_deps: [:ecto, :ecto_sql, :phoenix],
  subdirectories: ["priv/*/migrations"],
  inputs: ["*.{eex,ex,exs}", "{config,lib,test}/**/*.{eex,ex,exs}", "priv/*/seeds.exs"]
]
