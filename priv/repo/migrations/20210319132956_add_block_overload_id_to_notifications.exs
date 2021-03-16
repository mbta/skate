defmodule Skate.Repo.Migrations.AddBlockOverloadIdToNotifications do
  use Ecto.Migration

  def change do
    alter table(:notifications) do
      add(:block_overload_id, :bigint)
    end
  end
end
