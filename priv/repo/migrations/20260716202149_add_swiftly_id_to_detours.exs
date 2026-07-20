defmodule Skate.Repo.Migrations.AddSwiftlyIdToDetours do
  use Ecto.Migration

  def change do
    alter table(:detours) do
      add :swiftly_id, :string, null: true
    end
  end
end
