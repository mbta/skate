defmodule Skate.Repo.Migrations.AddDetourEstimatedDuration do
  use Ecto.Migration

  def change do
    alter table(:detours) do
      add :estimated_duration, :string, null: true
    end
  end
end
