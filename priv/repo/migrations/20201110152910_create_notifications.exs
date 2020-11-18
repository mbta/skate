defmodule Skate.Repo.Migrations.StoreNotifications do
  use Ecto.Migration

  def change do
    create table(:notifications) do
      add(:created_at, :bigint, null: false)
      add(:reason, :string, null: false)
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
  end
end
