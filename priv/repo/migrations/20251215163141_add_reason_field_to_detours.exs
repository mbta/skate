defmodule Skate.Repo.Migrations.AddReasonFieldToDetours do
  use Ecto.Migration

  def change do
    alter table(:detours) do
      add :reason, :string, null: true
    end
  end
end
