defmodule Skate.Repo.Migrations.AddStateToExpirationTask do
  use Ecto.Migration

  def change do
    alter table(:detour_expiration_tasks) do
      add(
        :status,
        :string,
        null: false,
        default: "scheduled"
      )
    end
  end
end
