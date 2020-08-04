defmodule Skate.Repo do
  use Ecto.Repo,
    otp_app: :skate,
    adapter: Ecto.Adapters.Postgres
end
