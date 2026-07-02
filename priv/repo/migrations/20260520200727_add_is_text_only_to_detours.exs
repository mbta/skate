defmodule Skate.Repo.Migrations.AddIsTextOnlyToDetours do
  use Ecto.Migration

  def change do
    alter table(:detours) do
      add :is_text_only, :boolean, default: false, null: false
    end
  end
end
