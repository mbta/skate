defmodule Skate.Repo.Migrations.CreateDetours do
  use Ecto.Migration

  def change do
    create table(:detours) do
      add :state, :map
      add :author_id, references(:users, on_delete: :nothing)

      timestamps()
    end

    create index(:detours, [:author_id])
  end
end
