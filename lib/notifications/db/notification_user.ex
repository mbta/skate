defmodule Notifications.Db.NotificationUser do
  use Ecto.Schema

  alias Notifications.NotificationState

  @primary_key false

  @type t() :: %__MODULE__{}

  schema "notifications_users" do
    field(:notification_id, :integer, primary_key: true)
    field(:user_id, :integer, primary_key: true)
    field(:state, NotificationState)
    timestamps()
  end
end
