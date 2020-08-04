defmodule Skate.Repo do
  require Logger

  use Ecto.Repo,
    otp_app: :skate,
    adapter: Ecto.Adapters.Postgres

  def add_prod_credentials(config, auth_token_fn \\ &ExAws.RDS.generate_db_auth_token/4) do
    hostname = System.get_env("POSTGRES_HOSTNAME")
    port = System.get_env("POSTGRES_PORT", "5432") |> String.to_integer()
    username = System.get_env("POSTGRES_USERNAME")

    token =
      auth_token_fn.(
        hostname,
        username,
        port,
        %{}
      )

    Keyword.merge(config,
      hostname: hostname,
      username: username,
      port: port,
      password: token
    )
  end
end
