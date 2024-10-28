defmodule Skate.Repo.Migrations.RedoRouteTabs do
  use Ecto.Migration

  def change do
    drop table(:tab_settings), mode: :cascade
    drop table(:route_tabs), mode: :cascade

    create table(:route_tabs, primary_key: false) do
      add(:uuid, :uuid, primary_key: true)

      add(:user_id, references(:users, on_delete: :delete_all, on_update: :update_all),
        null: false
      )

      add(:preset_name, :string)
      add(:selected_route_ids, {:array, :string}, null: false)
      add(:ladder_directions, :map, null: false)
      add(:ladder_crowding_toggles, :map, null: false)

      add(
        :save_changes_to_tab_uuid,
        references(:route_tabs,
          type: :uuid,
          column: :uuid,
          on_delete: :delete_all,
          on_update: :update_all
        )
      )

      add(:ordering, :integer)
      add(:is_current_tab, :boolean)
      timestamps()
    end
  end
end
