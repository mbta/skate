defmodule Skate.MixProject do
  use Mix.Project

  def project do
    [
      app: :skate,
      version: "0.1.0",
      elixir: "~> 1.13",
      elixirc_paths: elixirc_paths(Mix.env()),
      compilers: [:phoenix] ++ Mix.compilers(),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps(),
      test_coverage: [tool: LcovEx],
      elixirc_options: [warnings_as_errors: true],
      dialyzer: [
        plt_add_apps: [:mix, :laboratory]
      ]
    ]
  end

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
      included_applications: [:laboratory],
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
      {:bypass, "~> 2.1.0", only: :test},
      {:castore, "~> 0.1.5"},
      {:configparser_ex, "~> 4.0", only: :dev},
      {:credo, "~> 1.6", only: [:dev, :test], runtime: false},
      {:csv, "~> 2.4.1"},
      {:dialyxir, "~> 1.0", only: [:dev, :test], runtime: false},
      {:diskusage_logger, "~> 0.2.0"},
      {:ecto_sql, "~> 3.4"},
      {:ehmon, github: "mbta/ehmon", only: :prod},
      {:ex_aws_rds, "~> 2.0.2"},
      {:ex_aws_secretsmanager, "~> 2.0"},
      {:ex_aws, "~> 2.1"},
      {:ex_doc, "~> 0.27", only: :dev, runtime: false},
      {:ex_machina, "~> 2.7.0", only: :test},
      {:fast_local_datetime, "~> 1.0"},
      {:gen_stage, "~> 1.2.1"},
      {:guardian_phoenix, "~> 2.0"},
      {:guardian, "~> 2.0"},
      {:httpoison, "~> 2.1.0"},
      {:jason, "~> 1.0"},
      {:laboratory, github: "paulswartz/laboratory", ref: "cookie_opts"},
      {:lcov_ex, "~> 0.2", only: [:dev, :test], runtime: false},
      {:logster, "~> 1.0"},
      {:oban, "~> 2.15"},
      {:phoenix_ecto, "~> 4.0"},
      {:phoenix_html, "~> 3.0"},
      {:phoenix_live_reload, "~> 1.3", only: :dev},
      {:phoenix_pubsub, "~> 2.0"},
      {:phoenix, "~> 1.6.0"},
      {:plug_cowboy, "~> 2.1"},
      {:postgrex, "~> 0.15"},
      {:sentry, "~> 7.0"},
      {:server_sent_event_stage, "~> 1.1.0"},
      {:ssl_verify_fun, "~> 1.1"},
      {:stream_data, "~> 0.5.0", only: :test},
      {:timex, "~> 3.7.5"},
      {:ueberauth_cognito, "~> 0.4.0"},
      {:ueberauth, "~> 0.10.5"}
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
      test: ["ecto.create --quiet", "ecto.migrate_all", "test"]
    ]
  end
end
