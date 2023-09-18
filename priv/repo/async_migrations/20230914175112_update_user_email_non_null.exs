defmodule Skate.Repo.Migrations.UpdateUserEmailNonNull do
  use Ecto.Migration

  def up do
    alter table(:users) do
      modify :email, :string, null: false
    end
  end

  def down do
    alter table(:users) do
      modify :email, :string, null: true
    end
  end
end
