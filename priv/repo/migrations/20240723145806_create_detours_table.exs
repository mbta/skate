defmodule Skate.Repo.Migrations.CreateDetoursTable do
  use Ecto.Migration

  # excellent_migrations:safety-assured-for-this-file column_reference_added

  def change do
    create table(:detours) do
      add :state, :map
      add :author_id, references(:users, on_delete: :nothing)
      timestamps()
    end
  end
end
