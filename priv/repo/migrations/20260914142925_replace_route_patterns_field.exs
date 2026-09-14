defmodule Skate.Repo.Migrations.ReplaceRoutePatternsField do
  use Ecto.Migration

  def change do
    alter table(:detours) do
      add :route_pattern, :map

      # the following fields are no longer used and can be removed in an upcoming release
      # remove :route_patterns, {:array, :map}
      # remove :route_pattern_id, :string
      # remove :route_pattern_name, :string
    end
  end
end
