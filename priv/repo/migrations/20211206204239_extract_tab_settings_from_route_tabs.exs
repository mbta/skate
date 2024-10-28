defmodule Skate.Repo.Migrations.ExtractTabSettingsFromRouteTabs do
  use Ecto.Migration

  def change do
    execute("DELETE FROM route_tabs")
    create index("route_tabs", [:user_id, :ordering], unique: true)

    create table(:tab_settings) do
      add(:selected_route_ids, {:array, :string}, null: false)
      add(:ladder_directions, :map, null: false)
      add(:ladder_crowding_toggles, :map, null: false)
      add(:route_tab_id, references(:route_tabs, on_delete: :delete_all, on_update: :update_all))
      timestamps()
    end

    alter table(:route_tabs) do
      remove(:selected_route_ids)
      remove(:ladder_directions)
      remove(:ladder_crowding_toggles)
    end
  end
end
