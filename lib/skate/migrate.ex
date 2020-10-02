defmodule Skate.Migrate do
  def migrate() do
    Ecto.Migrator.run(
      Skate.Repo,
      Application.app_dir(:skate, "priv/repo/migrations"),
      :up,
      all: true
    )
  end
end
