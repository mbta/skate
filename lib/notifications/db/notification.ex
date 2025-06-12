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
    belongs_to(:detour_expiration, Notifications.Db.DetourExpiration)
  end

  @doc """
  Creates a new `Notifications.Db.Notification`.

  Using this function directly is not recommended, instead you should consider
  using changesets functions from the intended "Notification Type" to construct
  notifications.

  This function exists mainly to be used by `cast_assoc` from
  "Notification Type" changeset functions.

  If `:created_at` is not provided, it will default to the current
  time.

  ## Examples
  ### Create Notification with a backdated `created_at` timestamp
      iex> current_time =
      ...>   DateTime.utc_now()
      ...>   |> DateTime.shift(minute: -30)
      ...>   |> DateTime.to_unix()
      ...>
      ...> %{created_at: ^current_time} =
      ...>   %Notifications.Db.Notification{}
      ...>   |> Notifications.Db.Notification.changeset(%{created_at: current_time})
      ...>   |> Ecto.Changeset.apply_action!(:insert)

  ### Create Notification and default the current time to now
      iex> current_time = DateTime.utc_now() |> DateTime.to_unix()
      ...>
      ...> %{created_at: created_at} =
      ...>   %Notifications.Db.Notification{}
      ...>   |> Notifications.Db.Notification.changeset(%{})
      ...>   |> Ecto.Changeset.apply_action!(:insert)
      ...>
      ...> current_time <= created_at
      true

  """
  def changeset(notification, attrs) do
    notification
    |> cast(attrs, [:created_at])
    |> put_default(:created_at, fn -> DateTime.to_unix(DateTime.utc_now()) end)
    |> validate_required([:created_at])
  end

  defp put_default(changeset, key, value_fn) when is_function(value_fn, 0) do
    put_default(changeset, key, value_fn.())
  end

  defp put_default(changeset, key, value) do
    if field_missing?(changeset, key) do
      put_change(changeset, key, value)
    else
      changeset
    end
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
    Joins associated `Notifications.Db.Detour`'s on
    `Notifications.Db.Notification`'s and retrieves the Detour's
    associated info.

    ## Examples

    There is a `base` query struct that can be provided at the
    beginning of a query:

        iex> :detour
        ...> |> insert()
        ...> |> Notifications.Notification.create_activated_detour_notification_from_detour()
        ...>
        ...> all_detour_notifications =
        ...>   Notifications.Db.Notification.Queries.base()
        ...>   |> Notifications.Db.Notification.Queries.select_detour_info()
        ...>   |> Skate.Repo.all()
        ...>   |> Skate.Repo.preload(:detour)
        ...>
        ...> match?(
        ...>   [
        ...>     %Notifications.Db.Notification{
        ...>       detour: %Notifications.Db.Detour{}
        ...>     }
        ...>   ],
        ...>   all_detour_notifications
        ...> )
        true

    If `base` is omitted, then it's inferred:

        iex> :detour
        ...> |> insert()
        ...> |> Notifications.Notification.create_activated_detour_notification_from_detour()
        ...>
        ...> all_detour_notifications =
        ...>   Notifications.Db.Notification.Queries.select_detour_info()
        ...>   |> Skate.Repo.all()
        ...>   |> Skate.Repo.preload(:detour)
        ...>
        ...> match?(
        ...>   [
        ...>     %Notifications.Db.Notification{
        ...>       detour: %Notifications.Db.Detour{}
        ...>     }
        ...>   ],
        ...>   all_detour_notifications
        ...> )
        true

    """
    @spec select_detour_info(Ecto.Query.t()) :: Ecto.Query.t()
    @spec select_detour_info() :: Ecto.Query.t()
    def select_detour_info(query \\ base()) do
      from([notification: n] in query,
        left_join:
          detour in subquery(Notifications.Db.Detour.Queries.select_detour_notification_info()),
        on: detour.id == n.detour_id,
        select_merge: %{
          detour: detour
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
