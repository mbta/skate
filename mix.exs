defmodule Skate.MixProject do
  use Mix.Project

  def project do
    [
      app: :skate,
      version: "0.1.0",
      elixir: "~> 1.15",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps(),
      test_coverage: [tool: LcovEx],
      elixirc_options: [warnings_as_errors: true],
      consolidate_protocols: Mix.env() != :test,
      dialyzer: [
        plt_add_apps: [:mix]
      ],
      docs: docs_config()
    ]
  end

  def docs_config,
    do: [
      groups_for_modules: [
        "Ecto Schemas": &(&1[:section] == :ecto)
      ]
    ]

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    apps = [:logger, :runtime_tools]

    apps =
      if Mix.env() == :prod do
        [:ehmon, :diskusage_logger | apps]
      else
        apps
      end

    [
      mod: {Skate.Application, []},
      extra_applications: apps
    ]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [
      {:doctest_formatter, "~> 0.4.0", runtime: false},
      {:bypass, "~> 2.1.0", only: :test},
      {:castore, "~> 0.1.5"},
      {:configparser_ex, "~> 4.0", only: :dev},
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      {:csv, "~> 2.4.1"},
      {:dialyxir, "~> 1.4", only: [:dev, :test], runtime: false},
      {:diskusage_logger, "~> 0.2.0"},
      {:dns_cluster, "~> 0.1.3"},
      {:ecto_sql, "~> 3.4"},
      {:ehmon, github: "mbta/ehmon", only: :prod},
      {:emqtt_failover, "~> 0.3.0"},
      {:ex_aws, "~> 2.1"},
      {:ex_aws_rds, "~> 2.0.2"},
      {:ex_aws_secretsmanager, "~> 2.0"},
      {:ex_doc, "~> 0.27", only: :dev, runtime: false},
      {:ex_machina, "~> 2.7.0", only: :test},
      {:excellent_migrations, "~> 0.1", only: [:dev], runtime: false},
      {:gen_stage, "~> 1.2.1"},
      {:guardian, "~> 2.0"},
      {:guardian_phoenix, "~> 2.0"},
      {:haversine, "~> 0.1.0"},
      {:httpoison, "~> 2.2.1"},
      {:http_stage, "~> 0.2.0"},
      {:jason, "~> 1.0"},
      {:lcov_ex, "~> 0.2", only: [:dev, :test], runtime: false},
      {:logster, "~> 1.0"},
      {:map_diff, "~> 1.3.4"},
      {:mox, "~> 1.1.0", only: :test},
      {:oban, "~> 2.15"},
      {:phoenix, "~> 1.8.1"},
      {:phoenix_ecto, "~> 4.0"},
      {:phoenix_html, "~> 3.0"},
      {:phoenix_live_reload, "~> 1.3", only: :dev},
      {:phoenix_live_view, "~> 1.1"},
      {:phoenix_pubsub, "~> 2.0"},
      {:plug_cowboy, "~> 2.1"},
      {:polyline, "~> 1.4.0"},
      {:postgrex, "~> 0.15"},
      {:sentry, "~> 11.0"},
      {:server_sent_event_stage, "~> 1.2.1"},
      {:singleton, "~> 1.0"},
      {:sobelow, "~> 0.13", only: [:dev, :test], runtime: false},
      {:ssl_verify_fun, "~> 1.1"},
      {:stream_data, "~> 1.1.1", only: :test},
      {:telemetry, "~> 1.3"},
      {:timex, "~> 3.7.5"},
      {:typed_ecto_schema, "~> 0.4.1"},
      {:ueberauth, "~> 0.10.5"},
      {:ueberauth_oidcc, "~> 0.4.0"}
    ]
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to install project dependencies and perform other setup tasks, run:
  #
  #     $ mix setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    [
      setup: ["deps.get", "ecto.setup", "assets.setup", "phx.gen.cert"],
      "ecto.migrate_all": [
        "ecto.migrate --quiet --migrations-path=priv/repo/migrations --migrations-path=priv/repo/async_migrations"
      ],
      "ecto.setup": ["ecto.create", "ecto.migrate_all"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      "assets.setup": ["cmd npm --prefix=assets install"],
      "assets.reset": ["cmd npm --prefix=assets ci"],
      "assets.test": ["cmd npm --prefix=assets run check", "cmd npm --prefix=assets test"],
      test: ["ecto.create --quiet", "ecto.migrate_all", "test"],
      fmt: ["format", "cmd npm --prefix=assets run format"],
      sobelow:
        "sobelow --skip --exit=low --ignore Config.HTTPS,Config.CSWH,Config.Headers,Config.CSP",
      check: [
        "compile --force --all-warnings --warnings-as-errors",
        "format --check-formatted",
        "credo",
        "sobelow",
        "dialyzer --quiet",
        "excellent_migrations.check_safety"
      ]
    ]
  end
end
