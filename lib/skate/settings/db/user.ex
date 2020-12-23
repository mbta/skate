defmodule Skate.Settings.Db.User do
  use Ecto.Schema
  import Ecto.Changeset

  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.Db.NotificationUser, as: DbNotificationUser
  alias Skate.Settings.Db.RouteSettings, as: DbRouteSettings
  alias Skate.Settings.Db.UserSettings, as: DbUserSettings

  @type t :: %__MODULE__{}

  schema "users" do
    field(:username, :string)
    has_one(:user_settings, DbUserSettings)
    has_one(:route_settings, DbRouteSettings)
    timestamps()

    has_many(:notification_users, DbNotificationUser)
    many_to_many(:notifications, DbNotification, join_through: DbNotificationUser)
  end

  def changeset(user, attrs \\ %{}) do
    user
    |> cast(attrs, [
      :id,
      :username
    ])
    |> validate_required([
      :username
    ])
  end
end
