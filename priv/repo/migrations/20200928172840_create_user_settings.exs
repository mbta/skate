defmodule Skate.Repo.Migrations.CreateUserSettings do
  use Ecto.Migration

  def change do
    execute(
      "CREATE TYPE vehicle_label AS ENUM ('run_id', 'vehicle_id')",
      "DROP TYPE vehicle_label"
    )

    create table(:users) do
      add(:username, :string, null: false)
      timestamps()
    end

    create(
      unique_index(
        :users,
        [:username],
        name: :users_username_index
      )
    )

    create table(:user_settings, primary_key: false) do
      add(:user_id, references(:users, on_delete: :delete_all, on_update: :update_all),
        primary_key: true
      )

      add(:ladder_page_vehicle_label, :vehicle_label)
      add(:shuttle_page_vehicle_label, :vehicle_label)
      timestamps()
    end
  end
end
