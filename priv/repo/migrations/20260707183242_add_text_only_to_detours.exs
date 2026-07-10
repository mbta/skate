defmodule Skate.Repo.Migrations.AddTextOnlyToDetours do
  use Ecto.Migration

  def change do
    alter table(:detours) do
      add :is_text_only, :boolean, default: false, null: false
      add :typed_detour, :map, null: true
    end
  end
end
