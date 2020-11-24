defmodule Skate.Repo.Migrations.StoreNotifications do
  use Ecto.Migration

  def up do
    execute(
      "CREATE TYPE notification_reason AS ENUM ('manpower', 'disabled', 'diverted', 'accident', 'other', 'adjusted', 'operator_error', 'traffic')"
    )

    create table(:notifications) do
      add(:created_at, :bigint, null: false)
      add(:reason, :notification_reason, null: false)
      add(:route_ids, {:array, :string}, null: false)
      add(:run_ids, {:array, :string}, null: false)
      add(:trip_ids, {:array, :string}, null: false)
      add(:operator_id, :string)
      add(:operator_name, :string)
      add(:route_id_at_creation, :string)
      add(:block_id, :string, null: false)
      add(:service_id, :string, null: false)
      add(:start_time, :bigint, null: false)
      add(:end_time, :bigint, null: false)
      timestamps()
    end

    create(
      index(
        :notifications,
        [:start_time, :end_time, :block_id, :service_id, :reason],
        unique: true,
        name: "notifications_unique_index"
      )
    )
  end

  def down do
    drop(table(:notifications))
    execute("DROP TYPE notification_reason")
  end
end
