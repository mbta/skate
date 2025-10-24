defmodule Skate.Repo.Migrations.AddDetourCopiedFromIdToDetours do
  use Ecto.Migration

  def change do
    alter table(:detours) do
      add :copied_from_id, references(:detours, on_delete: :nothing), null: true
    end
  end
end
