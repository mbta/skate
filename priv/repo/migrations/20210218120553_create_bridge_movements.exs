defmodule Skate.Repo.Migrations.CreateBridgeMovements do
  use Ecto.Migration

  def change do
    execute(
      "CREATE TYPE bridge_status AS ENUM ('raised', 'lowered')",
      "DROP TYPE bridge_status"
    )

    create table(:bridge_movements) do
      add(:status, :bridge_status, null: false)
      add(:lowering_time, :bigint, null: true)
      timestamps()
    end

    create index(:bridge_movements, [:inserted_at])
  end
end
