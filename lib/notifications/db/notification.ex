defmodule Notifications.Db.Notification do
  @moduledoc """
  Ecto Model for `notifications` Database table
  """

  use Skate.Schema
  import Ecto.Changeset

  alias Notifications.Db.BlockWaiver, as: DbBlockWaiver
  alias Notifications.Db.BridgeMovement, as: DbBridgeMovement
  alias Notifications.Db.NotificationUser, as: DbNotificationUser
  alias Skate.Settings.Db.User, as: DbUser

  typed_schema "notifications" do
    field(:created_at, :integer)
    field(:state, :string, virtual: true)
    timestamps()

    has_many(:notification_users, DbNotificationUser)
    many_to_many(:users, DbUser, join_through: DbNotificationUser)

    belongs_to(:block_waiver, DbBlockWaiver)
    belongs_to(:bridge_movement, DbBridgeMovement)
    belongs_to(:detour, Notifications.Db.Detour)
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

  defmodule Queries do
    @moduledoc """
    Composable queries for accessing `Notifications.Db.Notification`
    related data
    """
    import Ecto.Query

    @doc """
    The "base" query that queries `Notifications.Db.Notification`'s without restriction
    """
    def base() do
      from(n in Notifications.Db.Notification, as: :notification, select_merge: n)
    end

    def select_user_read_state(query \\ base(), user_id \\ nil) do
      from([notification: n] in query,
        join: nu in assoc(n, :notification_users),
        as: :notification_user,
        join: u in assoc(nu, :user),
        as: :user,
        where: u.id == ^user_id,
        select_merge: %{
          state: nu.state
        }
      )
    end
    @doc """
    Joins associated `Notifications.Db.BridgeMovement`'s on
    `Notifications.Db.Notification`'s
    """
    @spec select_bridge_movements(Ecto.Query.t()) :: Ecto.Query.t()
    def select_bridge_movements(query \\ base()) do
      query
      |> with_named_binding(:bridge_movement, fn query, binding ->
        from([notification: n] in query,
          left_join: bm in assoc(n, ^binding),
          as: ^binding
        )
      end)
      |> select_merge([bridge_movement: bm], %{
        bridge_movement: bm
      })
    end

    @doc """
    Joins associated `Notifications.Db.BlockWaiver`'s on
    `Notifications.Db.Notification`'s
    """
    @spec select_block_waivers(Ecto.Query.t()) :: Ecto.Query.t()
    def select_block_waivers(query \\ base()) do
      query
      |> with_named_binding(:block_waiver, fn query, binding ->
        from([notification: n] in query,
          left_join: bw in assoc(n, ^binding),
          as: ^binding
        )
      end)
      |> select_merge([block_waiver: bw], %{
        block_waiver: bw
      })
    end
  end
end
