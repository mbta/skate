defmodule Skate.Repo.Migrations.CreateDetourNotificationsTable do
  use Ecto.Migration

  def change do
    create table(:detour_notifications) do
      add :detour_id, references(:detours, on_delete: :nothing)
      add :status, :string
    end
  end
end
