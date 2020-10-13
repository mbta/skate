defmodule Skate.Migrate do
  def up() do
    Ecto.Migrator.run(Skate.Repo, :up, all: true)
  end

  def down() do
    Ecto.Migrator.run(Skate.Repo, :down, all: true)
  end
end
