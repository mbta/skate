defmodule Skate.Settings.Db.User do
  use Ecto.Schema
  import Ecto.Changeset

  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.Db.NotificationUser, as: DbNotificationUser
  alias Skate.Settings.Db.UserSettings, as: DbUserSettings
  alias Skate.Settings.Db.RouteTab, as: DbRouteTab

  @type t :: %__MODULE__{}

  schema "users" do
    field(:username, :string)
    field(:uuid, :binary_id)
    has_one(:user_settings, DbUserSettings)
    timestamps()

    has_many(:notification_users, DbNotificationUser)
    many_to_many(:notifications, DbNotification, join_through: DbNotificationUser)
    has_many(:route_tabs, DbRouteTab, on_replace: :delete_if_exists)
  end

  def changeset(user, attrs \\ %{}) do
    user
    |> cast(attrs, [
      :id,
      :username
    ])
    |> cast_assoc(:route_tabs, with: &DbRouteTab.changeset/2)
    |> validate_required([
      :username
    ])
  end
end
