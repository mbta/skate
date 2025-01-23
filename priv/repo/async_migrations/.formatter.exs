[
  import_deps: [
    :ecto_sql,
    # When adding a "Migrating Schema", such as described in https://fly.io/phoenix-files/backfilling-data/
    # we need the `:ecto` formatter for formatting those schema files
    :ecto
  ],
  inputs: ["*.exs"]
]
