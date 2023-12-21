defmodule Skate.Repo.Migrations.CreateRouteTab do
  use Ecto.Migration

  def change do
    create table(:route_tabs) do
      add(:user_id, references(:users, on_delete: :delete_all, on_update: :update_all),
        null: false
      )

      add(:preset_name, :string)
      add(:selected_route_ids, {:array, :string}, null: false)
      add(:ladder_directions, :map, null: false)
      add(:ladder_crowding_toggles, :map, null: false)

      add(
        :save_changes_to_tab_id,
        references(:route_tabs, on_delete: :delete_all, on_update: :update_all)
      )

      add(:ordering, :integer)
      add(:is_current_tab, :boolean)
      timestamps()
    end
  end
end
