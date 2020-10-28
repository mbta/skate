defmodule Skate.Repo.Migrations.CreateRouteSettings do
  use Ecto.Migration
  alias Skate.Settings.RouteSetting

  def change do
    create table(:route_settings, primary_key: false) do
      add(
        :user_id,
        references(:users, on_delete: :delete_all, on_update: :update_all, primary_key: true),
        primary_key: true
      )

      add(:route_ids, {:array, :string}, null: false)
      add(:ladder_directions, :map, null: false)
      add(:crowding_toggles, :map, null: false)
      timestamps()
    end
  end
end
