defmodule Skate.Repo.Migrations.CreateDetoursTable do
  use Ecto.Migration

  def change do
    create table(:detours) do
      add :state, :map
      add :author_id, references(:users, on_delete: :nothing)
      timestamps()
    end
  end
end
