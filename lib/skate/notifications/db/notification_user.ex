defmodule Skate.Notifications.Db.NotificationUser do
  @moduledoc """
  Ecto Model for `notification_users` Database table
  """

  use Skate.Schema

  alias Skate.Notifications.Db.Notification, as: DbNotification
  alias Skate.Notifications.NotificationState
  alias Skate.Settings.Db.User, as: DbUser

  @primary_key false

  typed_schema "notifications_users" do
    belongs_to(:notification, DbNotification)
    belongs_to(:user, DbUser)
    field(:state, NotificationState, default: :unread)
    timestamps()
  end
end
