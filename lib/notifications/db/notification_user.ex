defmodule Notifications.Db.NotificationUser do
  use Ecto.Schema
  import Ecto.Changeset

  alias Notifications.NotificationState

  @type t() :: %__MODULE__{}

  schema "notifications_users" do
    field(:notification_id, :integer)
    field(:user_id, :integer)
    field(:state, NotificationState)
    timestamps()
  end

  def changeset(notification_user, attrs \\ %{}) do
    notification_user
    |> cast(attrs, [:notification_id, :user_id, :state])
    |> validate_required([:notification_id, :user_id, :state])
    |> unique_constraint([:notification_id, :user_id], name: "notifications_users_pkey")
  end
end
