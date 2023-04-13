defmodule Skate.Repo.Migrations.UpdateUserEmailNonNill do
  use Ecto.Migration

  def change do
    alter table(:users) do
      modify :email, :string, null: false
    end
  end
end
