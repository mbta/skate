defmodule Skate.Repo.Migrations.CreateNotificationsUsers do
  use Ecto.Migration

  def up do
    execute("CREATE TYPE notification_state AS ENUM ('unread', 'read', 'deleted')")

    create table(:notifications_users, primary_key: false) do
      add(
        :notification_id,
        references(:notifications,
          on_delete: :delete_all,
          on_update: :update_all
        ),
        primary_key: true
      )

      add(
        :user_id,
        references(:users, on_delete: :delete_all, on_update: :update_all),
        primary_key: true
      )

      add(:state, :notification_state, null: false)
      timestamps()
    end
  end

  def down do
    drop(table(:notifications_users))
    execute("DROP TYPE notification_state")
  end
end
