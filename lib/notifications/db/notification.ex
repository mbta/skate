defmodule Notifications.Db.Notification do
  use Ecto.Schema
  import Ecto.Changeset

  alias Notifications.NotificationReason

  @type t() :: %__MODULE__{}

  schema "notifications" do
    field(:created_at, :integer)
    field(:reason, NotificationReason)
    field(:route_ids, {:array, :string})
    field(:run_ids, {:array, :string})
    field(:trip_ids, {:array, :string})
    field(:operator_id, :string)
    field(:operator_name, :string)
    field(:route_id_at_creation, :string)
    field(:start_time, :integer)
    timestamps()
  end

  def changeset(notification, attrs \\ %{}) do
    notification
    |> cast(attrs, [
      :id,
      :created_at,
      :reason,
      :route_ids,
      :run_ids,
      :trip_ids,
      :operator_id,
      :operator_name,
      :route_id_at_creation,
      :start_time
    ])
    |> validate_required([
      :created_at,
      :reason,
      :route_ids,
      :run_ids,
      :trip_ids,
      :start_time
    ])
  end
end
