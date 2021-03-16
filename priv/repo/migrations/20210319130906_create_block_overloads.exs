defmodule Skate.Repo.Migrations.CreateBlockOverloads do
  use Ecto.Migration

  def change do
    create table(:block_overloads) do
      add(:created_on, :date, null: false)
      add(:vehicle_id, :string, null: false)
      add(:block_id, :string, null: false)
      add(:operator_id, :string)
      add(:operator_name, :string)
      timestamps()
    end

    create(
      index(
        :block_overloads,
        [:created_on, :vehicle_id, :block_id],
        unique: true
      )
    )
  end
end
