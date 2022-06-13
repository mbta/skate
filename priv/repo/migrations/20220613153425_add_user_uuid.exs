defmodule Skate.Repo.Migrations.AddUserUuid do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add(:uuid, :binary_id)
    end
  end
end
