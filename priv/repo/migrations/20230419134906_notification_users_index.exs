defmodule Skate.Repo.Migrations.Notification_users_index do
  use Ecto.Migration

  def change do
    create index("notifications_users", [:user_id])
  end
end
