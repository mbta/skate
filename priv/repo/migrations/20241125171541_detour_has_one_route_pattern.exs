defmodule Skate.Repo.Migrations.DetourHasOneRoutePattern do
  use Ecto.Migration

  def change do
    alter table(:detours) do
      add :route_pattern_id, references(:route_patterns)
    end
  end
end
