defmodule Skate.Repo.Migrations.AddDetourCopiedFromIdToDetours do
  use Ecto.Migration

  # excellent_migrations:safety-assured-for-this-file column_reference_added

  def change do
    alter table(:detours) do
      add :copied_from_id, references(:detours, on_delete: :nothing), null: true
    end
  end
end
