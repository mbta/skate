defmodule Notifications.Db.Notification do
  @moduledoc false

  use Ecto.Schema
  import Ecto.Changeset

  alias Notifications.Db.BlockWaiver, as: DbBlockWaiver
  alias Notifications.Db.BridgeMovement, as: DbBridgeMovement
  alias Notifications.Db.NotificationUser, as: DbNotificationUser
  alias Skate.Settings.Db.User, as: DbUser

  @type t() :: %__MODULE__{}

  schema "notifications" do
    field(:created_at, :integer)
    field(:state, :string, virtual: true)
    timestamps()

    has_many(:notification_users, DbNotificationUser)
    many_to_many(:users, DbUser, join_through: DbNotificationUser)

    belongs_to(:block_waiver, DbBlockWaiver)
    belongs_to(:bridge_movement, DbBridgeMovement)
  end

  def block_waiver_changeset(notification, attrs \\ %{}) do
    block_waiver_values =
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
      DbBlockWaiver.changeset(%DbBlockWaiver{}, block_waiver_values)
    )
    |> validate_required([
      :created_at
    ])
  end

  def bridge_movement_changeset(notification, attrs \\ %{}) do
    notification
    |> cast(attrs, [:id, :created_at, :bridge_movement_id])
    |> put_assoc(
      :bridge_movement,
      DbBridgeMovement.changeset(%DbBridgeMovement{}, attrs)
    )
    |> validate_required(:created_at)
  end
end
