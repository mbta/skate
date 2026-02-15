defmodule Skate.Notifications.Notification do
  @moduledoc """
  Context for managing Notifications.
  """

  import Ecto.Query

  alias Skate.Settings.Db.User, as: DbUser
  alias Skate.Notifications
  alias Skate.Notifications.NotificationState
  alias Skate.Notifications.Db.NotificationUser, as: DbNotificationUser
  alias Skate.Notifications.NotificationEncoder

  require Logger

  @notification_expiration_threshold 8 * 60 * 60

  @type id :: integer()

  @type t() ::
          %__MODULE__{
            id: id(),
            created_at: Util.Time.timestamp(),
            state: NotificationState.t(),
            content:
              Notifications.Db.BlockWaiver.t()
              | Notifications.Db.BridgeMovement.t()
              | Notifications.Db.Detour.t()
          }

  @derive Jason.Encoder

  @enforce_keys [
    :id,
    :created_at,
    :state,
    :content
  ]

  defstruct [
    :id,
    :created_at,
    :state,
    :content
  ]

  @doc """
  Retrieves `Notifications.Db.Notification` and associated Notification Type
  data for the given Notification ID.
  """
  def get_notification(id) do
    import Notifications.Db.Notification.Queries

    base()
    |> select_bridge_movements()
    |> select_block_waivers()
    |> select_detour_info()
    |> select_detour_expiration_notifications()
    |> where(id: ^id)
    |> Skate.Repo.one()
  end

  @doc """
  Fetches a notification using `Notifications.Notification.get_notification/1`
  and converts it to a `Notifications.Notification` struct.

  Prefer `Notifications.Notification.get_notification/1` if you do not need to
  send the returned notification to the frontend.
  """
  def get_domain_notification(id) do
    id
    |> get_notification()
    |> NotificationEncoder.from_db_notification()
  end

  def get_notification_user_ids(id) do
    Skate.Repo.all(
      from(n in Notifications.Db.Notification,
        where: [id: ^id],
        join: user in assoc(n, :users),
        select: user.id
      )
    )
  end

  defp broadcast_notification(
         {:ok, %{notification: %Notifications.Db.Notification{id: id}}} = input,
         users
       ) do
    broadcast_notification_by_id(id, users)

    input
  end

  defp broadcast_notification(input, _), do: input

  defp broadcast_notification_by_id(id, :users_from_notification),
    do: broadcast_notification_by_id(id, get_notification_user_ids(id))

  defp broadcast_notification_by_id(id, users) do
    id
    |> get_domain_notification()
    |> Notifications.NotificationServer.broadcast_notification(users)
  end

  defp notification_log_message(
         {:ok,
          %Notifications.Db.Detour{
            status: status,
            detour_id: detour_id,
            notification: %{created_at: created_at}
          }}
       ),
       do:
         "result=notification_created" <>
           " type=DetourStatus" <>
           " created_at=#{created_at |> DateTime.from_unix!() |> DateTime.to_iso8601()}" <>
           " detour_id=#{detour_id}" <>
           " status=#{status}"

  defp notification_log_message(
         {:ok,
          %Notifications.Db.DetourExpiration{
            detour_id: detour_id,
            expires_in: expires_in,
            estimated_duration: estimated_duration,
            notification: %{created_at: created_at}
          }}
       ),
       do:
         "result=notification_created" <>
           " type=DetourExpiration" <>
           " created_at=#{created_at |> DateTime.from_unix!() |> DateTime.to_iso8601()}" <>
           " detour_id=#{detour_id}" <>
           " expires_in=#{Duration.to_iso8601(expires_in)}" <>
           " estimated_duration=#{inspect(estimated_duration)}"

  defp notification_log_message(
         {:ok,
          %Notifications.Db.BridgeMovement{
            status: status,
            lowering_time: lowering_time,
            notification: %{created_at: created_at}
          }}
       ),
       do:
         "result=notification_created" <>
           " type=BridgeMovement" <>
           " created_at=#{created_at |> DateTime.from_unix!() |> DateTime.to_iso8601()}" <>
           " status=#{status}" <>
           " lowering_time=#{if is_integer(lowering_time), do: lowering_time |> DateTime.from_unix!() |> DateTime.to_iso8601(), else: "nil"}"

  defp notification_log_message(
         {:ok,
          %Notifications.Db.BlockWaiver{
            reason: reason,
            block_id: block_id,
            service_id: service_id,
            route_ids: route_ids,
            run_ids: run_ids,
            trip_ids: trip_ids,
            start_time: start_time,
            end_time: end_time,
            notification: %{created_at: created_at}
          }}
       ),
       do:
         "result=notification_created" <>
           " type=BlockWaiver" <>
           " created_at=#{format_unix_timestamp(created_at)}" <>
           " reason=#{reason}" <>
           " block_id=#{block_id} service_id=#{service_id}" <>
           " route_ids=#{inspect(route_ids)} run_ids=#{inspect(run_ids)} trip_ids=#{inspect(trip_ids)}" <>
           " start_time=#{format_unix_timestamp(start_time)} end_time=#{format_unix_timestamp(end_time)}"

  defp notification_log_message({:error, error}),
    do: "result=error error=#{inspect(error)}"

  defp format_unix_timestamp(timestamp),
    do: timestamp |> DateTime.from_unix!() |> DateTime.to_iso8601()

  defp notification_log_level({:ok, _}), do: :info
  defp notification_log_level({:error, _}), do: :warning

  # Macro that logs notification repo operation information in
  # context, so that `:mfa` matches the caller
  defmacrop log_notification(repo_operation) do
    quote do
      repo_operation = unquote(repo_operation)
      Logger.log(notification_log_level(repo_operation), notification_log_message(repo_operation))

      repo_operation
    end
  end

  def create_bridge_movement_notification(attrs) do
    %Notifications.Db.BridgeMovement{}
    |> Notifications.Db.BridgeMovement.changeset(attrs)
    |> Skate.Repo.insert()
    |> log_notification()
    |> broadcast_notification(:users_from_notification)
  end

  def create_block_waiver_notification(attrs) do
    %Notifications.Db.BlockWaiver{}
    |> Notifications.Db.BlockWaiver.changeset(attrs)
    |> Skate.Repo.insert()
    |> log_notification()
    |> broadcast_notification(:users_from_notification)
  end

  @doc """
  Creates a new detour expiration notification and broadcasts to subscribed
  users.

  ## Example
  ### Creating a notification
      iex> %Skate.Detours.Db.Detour{id: detour_id} = detour = Skate.Factory.insert(:detour)
      ...>
      ...> {:ok, result} =
      ...>   Skate.Notifications.Notification.create_detour_expiration_notification(%{
      ...>     detour: detour,
      ...>     expires_in: Duration.new!(minute: 30),
      ...>     estimated_duration: "1 hour",
      ...>     notification: %{}
      ...>   })
      ...>
      ...> %Skate.Notifications.Db.DetourExpiration{
      ...>   detour_id: ^detour_id,
      ...>   notification: %Skate.Notifications.Db.Notification{}
      ...> } = result

  ### Creating a notification and backdating the notification `created_at` time
      iex> %Skate.Detours.Db.Detour{id: detour_id} = detour = Skate.Factory.insert(:detour)
      ...>
      ...> created_at =
      ...>   DateTime.utc_now()
      ...>   |> DateTime.shift(minute: -30)
      ...>   |> DateTime.to_unix()
      ...>
      ...> {:ok, result} =
      ...>   Skate.Notifications.Notification.create_detour_expiration_notification(%{
      ...>     detour: detour,
      ...>     expires_in: Duration.new!(minute: 30),
      ...>     estimated_duration: "1 hour",
      ...>     notification: %{
      ...>       created_at: created_at
      ...>     }
      ...>   })
      ...>
      ...> %Skate.Notifications.Db.DetourExpiration{
      ...>   detour_id: ^detour_id,
      ...>   notification: %Skate.Notifications.Db.Notification{created_at: ^created_at}
      ...> } = result
  """
  def create_detour_expiration_notification(params) when is_map(params) do
    create_detour_expiration_notification(Map.get(params, :detour), params)
  end

  def create_detour_expiration_notification(%Skate.Detours.Db.Detour{} = detour, params) do
    params = Map.put_new(params, :route_id, detour.state["context"]["route"]["id"])

    detour
    |> Ecto.build_assoc(:detour_expiration_notifications)
    |> Notifications.Db.DetourExpiration.changeset(params)
    |> Skate.Repo.insert()
    |> log_notification()
    |> broadcast_notification(:users_from_notification)
  end

  @doc """
  Creates a new Detour Status notification for an deactivated detour and broadcasts to subscribed users.
  """
  def create_deactivated_detour_notification_from_detour(%Skate.Detours.Db.Detour{} = detour) do
    detour
    |> Ecto.build_assoc(:detour_status_notifications)
    |> Notifications.Db.Detour.changeset(%{
      status: :deactivated,
      route_id: detour.state["context"]["route"]["id"]
    })
    |> Skate.Repo.insert()
    |> log_notification()
    |> broadcast_notification(:users_from_notification)
  end

  @doc """
  Creates a new Detour Status notification for an activated detour and broadcasts to subscribed users.
  """
  def create_activated_detour_notification_from_detour(%Skate.Detours.Db.Detour{} = detour) do
    detour
    |> Ecto.build_assoc(:detour_status_notifications)
    |> Notifications.Db.Detour.changeset(%{
      status: :activated,
      route_id: detour.state["context"]["route"]["id"]
    })
    |> Skate.Repo.insert()
    |> log_notification()
    |> broadcast_notification(:users_from_notification)
  end

    @doc """
  Creates a new Detour Status notification for an updated detour and broadcasts to subscribed users.
  """
  def create_updated_detour_notification_from_detour(%Skate.Detours.Db.Detour{} = detour) do
    detour
    |> Ecto.build_assoc(:detour_status_notifications)
    |> Notifications.Db.Detour.changeset(%{
      status: :updated,
      route_id: detour.state["context"]["route"]["id"]
    })
    |> Skate.Repo.insert()
    |> log_notification()
    |> broadcast_notification(:users_from_notification)
  end

  @spec unexpired_notifications_for_user(DbUser.id(), (-> Util.Time.timestamp())) :: [t()]
  def unexpired_notifications_for_user(user_id, now_fn \\ &Util.Time.now/0) do
    import Notifications.Db.Notification.Queries

    cutoff_time = now_fn.() - @notification_expiration_threshold

    base()
    |> select_user_read_state(user_id)
    |> select_bridge_movements()
    |> select_block_waivers()
    |> select_detour_info()
    |> select_detour_expiration_notifications()
    |> where([notification: n], n.created_at > ^cutoff_time)
    |> order_by([notification: n], desc: n.created_at)
    |> Skate.Repo.all()
    |> Enum.map(&NotificationEncoder.from_db_notification/1)
  end

  @spec update_read_states(DbUser.id(), [id()], NotificationState.t()) ::
          {non_neg_integer(), nil | [term()]}
  def update_read_states(user_id, notification_ids, read_state)
      when read_state in [:read, :unread, :deleted] do
    query =
      from(nu in DbNotificationUser,
        join: u in assoc(nu, :user),
        where: u.id == ^user_id,
        where: nu.notification_id in ^notification_ids
      )

    Skate.Repo.update_all(query, set: [state: read_state])
  end

  defdelegate subscribe(user_id), to: Notifications.NotificationServer
end
