defmodule Skate.Repo.Migrations.AddMapPointsToDetours do
  use Ecto.Migration

  def change do
    alter table(:detours) do
      add :start_point, :map, null: true
    end

    alter table(:detours) do
      add :end_point, :map, null: true
    end

    alter table(:detours) do
      add :waypoints, {:array, :map}, null: true
    end
  end
end
