defmodule Skate.Repo.Migrations.RemoveRouteSettings do
  use Ecto.Migration

  def up do
    drop table(:route_settings)

    create(index(:route_tabs, [:selected_route_ids], using: :gin))
  end

  def down do
    create table(:route_settings, primary_key: false) do
      add(
        :user_id,
        references(:users, on_delete: :delete_all, on_update: :update_all, primary_key: true),
        primary_key: true
      )

      add(:selected_route_ids, {:array, :string}, null: false)
      add(:ladder_directions, :map, null: false)
      add(:ladder_crowding_toggles, :map, null: false)
      timestamps()
    end

    create(index(:route_settings, [:selected_route_ids], using: :gin))

    drop(index(:route_tabs, [:selected_route_ids], using: :gin))
  end
end
