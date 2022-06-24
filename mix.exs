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
      deps: deps(),
      test_coverage: [tool: ExCoveralls],
      preferred_cli_env: [
        coveralls: :test,
        "coveralls.detail": :test,
        "coveralls.post": :test,
        "coveralls.html": :test,
        "coveralls.github": :test
      ],
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
      {:phoenix, "~> 1.6.0"},
      {:phoenix_pubsub, "~> 2.0"},
      {:phoenix_html, "~> 3.0"},
      {:phoenix_live_reload, "~> 1.3", only: :dev},
      {:ex_aws, "~> 2.1"},
      {:ex_aws_secretsmanager, "~> 2.0"},
      {:jason, "~> 1.0"},
      {:plug_cowboy, "~> 2.1"},
      {:gen_stage, "~> 1.1.0"},
      {:ueberauth, "~> 0.9.0"},
      {:ueberauth_cognito, "~> 0.4.0"},
      {:guardian, "~> 2.0"},
      {:guardian_phoenix, "~> 2.0"},
      {:excoveralls, "~> 0.10", only: :test},
      {:dialyxir, "~> 1.0", only: [:dev, :test], runtime: false},
      {:ehmon, github: "mbta/ehmon", only: :prod},
      {:diskusage_logger, "~> 0.2.0"},
      {:httpoison, "~> 1.8.0"},
      {:bypass, "~> 2.1.0", only: :test},
      {:csv, "~> 2.4.1"},
      {:timex, "~> 3.7.5"},
      {:stream_data, "~> 0.5.0", only: :test},
      {:server_sent_event_stage, "~> 1.1.0"},
      {:castore, "~> 0.1.5"},
      {:laboratory, github: "paulswartz/laboratory", ref: "cookie_opts"},
      {:sentry, "~> 7.0"},
      {:phoenix_ecto, "~> 4.0"},
      {:ecto_sql, "~> 3.4"},
      {:postgrex, "~> 0.15"},
      {:ex_aws_rds, "~> 2.0.2"},
      {:fast_local_datetime, "~> 1.0"},
      {:ex_machina, "~> 2.7.0", only: :test},
      {:logster, "~> 1.0"},
      {:ssl_verify_fun, "~> 1.1"}
    ]
  end
end
