defmodule Skate.Migrate do
  def up() do
    Ecto.Migrator.run(Skate.Repo, :up, all: true)
  end
end
