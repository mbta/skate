defmodule Skate.Repo.Migrations.AddBridgeMovementIdToNotifications do
  use Ecto.Migration

  def change do
    alter table(:notifications) do
      add(:bridge_movement_id, :bigint)
    end
  end
end
