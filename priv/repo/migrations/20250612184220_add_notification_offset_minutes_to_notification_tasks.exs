defmodule Skate.Repo.Migrations.AddNotificationOffsetMinutesToNotificationTasks do
  use Ecto.Migration

  def change do
    alter table(:detour_expiration_tasks) do
      add(
        :notification_offset_minutes,
        :integer,
        null: false,
        default: 0
      )
    end
  end
end
