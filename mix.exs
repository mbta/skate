defmodule Skate.MixProject do
  use Mix.Project

  def project do
    [
      app: :skate,
      version: "0.1.0",
      elixir: "~> 1.5",
      elixirc_paths: elixirc_paths(Mix.env()),
      compilers: [:phoenix] ++ Mix.compilers(),
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      test_coverage: [tool: ExCoveralls],
      preferred_cli_env: [
        coveralls: :test,
        "coveralls.detail": :test,
        "coveralls.json": :test,
        "coveralls.html": :test
      ],
      elixirc_options: [warnings_as_errors: true],
      dialyzer: [plt_add_apps: [:mix, :laboratory], ignore_warnings: ".dialyzer.ignore-warnings"]
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
      {:phoenix, "~> 1.4.1"},
      {:phoenix_pubsub, "~> 1.1"},
      {:phoenix_html, "~> 2.11"},
      {:phoenix_live_reload, "~> 1.2", only: :dev},
      {:jason, "~> 1.0"},
      {:plug_cowboy, "~> 2.0"},
      {:gen_stage, "~> 0.14.1"},
      {:ueberauth, "~> 0.6.1"},
      {:ueberauth_cognito, git: "https://github.com/mbta/ueberauth_cognito.git"},
      {:guardian, "~> 2.0"},
      {:excoveralls, "~> 0.10", only: :test},
      {:dialyxir, "~> 0.5", only: [:dev, :test], runtime: false},
      {:distillery, "~> 2.0", runtime: false},
      {:ehmon, github: "mbta/ehmon", only: :prod},
      {:diskusage_logger, "~> 0.2.0"},
      {:httpoison, "~> 1.6.1"},
      {:bypass, "~> 1.0.0", only: :test},
      {:csv, "~> 2.3.0"},
      {:timex, "~> 3.5.0"},
      {:stream_data, "~> 0.4.3", only: :test},
      {:laboratory, github: "paulswartz/laboratory", ref: "cookie_opts"}
    ]
  end
end
