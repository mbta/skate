defmodule Skate.Repo.Migrations.ReadFromBlockWaivers do
  use Ecto.Migration

  def up do
    alter table("notifications") do
      modify :reason, :notification_reason, null: true
      modify :route_ids, {:array, :string}, null: true
      modify :run_ids, {:array, :string}, null: true
      modify :trip_ids, {:array, :string}, null: true
      modify :block_id, :string, null: true
      modify :service_id, :string, null: true
      modify :start_time, :bigint, null: true
      modify :end_time, :bigint, null: true
    end

    drop index("notifications", :unique)
  end

  def down do
    alter table("notifications") do
      modify :reason, :notification_reason, null: false
      modify :route_ids, {:array, :string}, null: false
      modify :run_ids, {:array, :string}, null: false
      modify :trip_ids, {:array, :string}, null: false
      modify :block_id, :string, null: false
      modify :service_id, :string, null: false
      modify :start_time, :bigint, null: false
      modify :end_time, :bigint, null: false
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
end
