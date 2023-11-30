defmodule Notifications.Db.NotificationUser do
  @moduledoc false

  use Ecto.Schema

  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.NotificationState
  alias Skate.Settings.Db.User, as: DbUser

  @primary_key false

  @type t() :: %__MODULE__{}

  schema "notifications_users" do
    belongs_to(:notification, DbNotification)
    belongs_to(:user, DbUser)
    field(:state, NotificationState)
    timestamps()
  end
end
