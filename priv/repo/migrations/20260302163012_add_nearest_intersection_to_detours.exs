defmodule Skate.Repo.Migrations.AddNearestIntersectionToDetours do
  use Ecto.Migration

  def change do
    alter table(:detours) do
      add :nearest_intersection, :string, null: true
    end
  end
end
