defmodule Skate.Repo.Migrations.CreateBlockWaivers do
  use Ecto.Migration

  def up do
    create table(:block_waivers) do
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
        :block_waivers,
        [:start_time, :end_time, :block_id, :service_id, :reason],
        unique: true,
        name: "block_waivers_unique_index"
      )
    )

    alter table("notifications") do
      add :block_waiver_id, :bigint
    end
  end

  def down do
    alter table("notifications") do
      remove :block_waiver_id
    end

    drop(table(:block_waivers))
  end
end
