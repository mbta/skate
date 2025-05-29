defmodule Skate.Repo.Migrations.AddDetourExpirationTasksTable do
  use Ecto.Migration

  def change do
    create table("detour_expiration_tasks") do
      add :expires_at, :utc_datetime_usec, null: false
      add :detour_id, references(:detours, on_delete: :delete_all, on_update: :update_all), null: false
      timestamps()
    end
  end
end
