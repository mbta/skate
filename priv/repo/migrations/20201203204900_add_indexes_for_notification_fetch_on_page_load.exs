defmodule Skate.Repo.Migrations.AddIndexesForNotificationFetchOnPageLoad do
  use Ecto.Migration

  def change do
    create(index(:route_settings, [:selected_route_ids], using: :gin))
    create(index(:notifications, [:route_ids], using: :gin))
    create(index(:notifications, [:end_time]))
  end
end
