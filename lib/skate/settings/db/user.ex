defmodule Skate.Settings.Db.User do
  @moduledoc """
  Ecto Model for `users` Database table
  """

  use Skate.Schema
  import Ecto.Changeset

  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.Db.NotificationUser, as: DbNotificationUser
  alias Skate.Settings.Db.RouteTab, as: DbRouteTab
  alias Skate.Settings.Db.TestGroupUser, as: DbTestGroupUser
  alias Skate.Settings.Db.UserSettings, as: DbUserSettings
  alias Skate.Detours.Db.Detour

  @type id :: integer()

  typed_schema "users" do
    field(:username, :string)
    field(:uuid, :binary_id)
    field(:email, :string)
    has_one(:user_settings, DbUserSettings)
    timestamps()

    has_many(:notification_users, DbNotificationUser)
    many_to_many(:notifications, DbNotification, join_through: DbNotificationUser)
    has_many(:route_tabs, DbRouteTab, on_replace: :delete_if_exists)

    has_many(:test_group_users, DbTestGroupUser, on_replace: :delete_if_exists)
    has_many(:test_groups, through: [:test_group_users, :test_group])

    has_many(:detours, Detour, foreign_key: :author_id)
  end

  def changeset(user, attrs \\ %{}) do
    user
    |> cast(attrs, [
      :id,
      :username,
      :email
    ])
    |> cast_assoc(:route_tabs, with: &DbRouteTab.changeset/2)
    |> validate_required([
      :username
    ])
  end
end
