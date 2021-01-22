defmodule Notifications.Db.Notification do
  use Ecto.Schema
  import Ecto.Changeset

  alias Notifications.NotificationReason
  alias Notifications.Db.BlockWaiver, as: DbBlockWaiver
  alias Notifications.Db.NotificationUser, as: DbNotificationUser
  alias Skate.Settings.Db.User, as: DbUser

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
    field(:block_id, :string)
    field(:service_id, :string)
    field(:start_time, :integer)
    field(:end_time, :integer)
    field(:state, :string, virtual: true)
    timestamps()

    has_many(:notification_users, DbNotificationUser)
    many_to_many(:users, DbUser, join_through: DbNotificationUser)

    belongs_to(:block_waiver, DbBlockWaiver)
  end

  def changeset(notification, attrs \\ %{}) do
    block_waiver =
      notification
      |> Map.from_struct()
      |> Map.merge(attrs)
      |> Map.take([
        :created_at,
        :reason,
        :route_ids,
        :run_ids,
        :trip_ids,
        :operator_id,
        :operator_name,
        :route_id_at_creation,
        :block_id,
        :service_id,
        :start_time,
        :end_time
      ])

    notification
    |> cast(attrs, [
      :id,
      :created_at,
      :block_waiver_id
    ])
    |> put_assoc(
      :block_waiver,
      DbBlockWaiver.changeset(%DbBlockWaiver{}, block_waiver)
    )
    |> validate_required([
      :created_at
    ])
  end
end
