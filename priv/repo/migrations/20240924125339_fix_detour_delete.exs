defmodule Skate.Repo.Migrations.FixDetourDelete do
  use Ecto.Migration

  def change do
    alter table(:detour_notifications) do
      modify :detour_id,
             references(:detours, on_delete: :delete_all),
             from: references(:posts, on_delete: :nothing)
    end

    alter table(:notifications) do
      modify :detour_id,
             references(:detour_notifications, on_delete: :delete_all),
             from: references(:detour_notifications)
    end
  end
end
