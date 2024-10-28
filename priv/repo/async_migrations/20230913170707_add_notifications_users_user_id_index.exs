defmodule Skate.Repo.Migrations.AddNotificationsUsersUserIdIndex do
  use Ecto.Migration

  def change do
    create index("notifications_users", [:user_id])
  end
end
