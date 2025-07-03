defmodule Notifications.Notification do
  @moduledoc """
  Context for managing Notifications.
  """

  import Skate.Repo

  import Ecto.Query

  alias Notifications.Db.BlockWaiver
  alias Notifications.Db.BridgeMovement
  alias Skate.Settings.Db.User, as: DbUser
  alias Skate.Settings.User
  alias Notifications.NotificationState
  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.Db.NotificationUser, as: DbNotificationUser

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
    |> from_db_notification()
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

  defp notification_log_message({:error, error}),
    do: "result=error error=#{inspect(error)}"

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

  @doc """
  Creates a new detour expiration notification and broadcasts to subscribed
  users.

  ## Example
  ### Creating a notification
      iex> %Skate.Detours.Db.Detour{id: detour_id} = detour = Skate.Factory.insert(:detour)
      ...>
      ...> {:ok, result} =
      ...>   Notifications.Notification.create_detour_expiration_notification(%{
      ...>     detour: detour,
      ...>     expires_in: Duration.new!(minute: 30),
      ...>     estimated_duration: "1 hour",
      ...>     notification: %{}
      ...>   })
      ...>
      ...> %Notifications.Db.DetourExpiration{
      ...>   detour_id: ^detour_id,
      ...>   notification: %Notifications.Db.Notification{}
      ...> } = result

  ### Creating a notification and backdating the notification `created_at` time
      iex> %Skate.Detours.Db.Detour{id: detour_id} = detour = Skate.Factory.insert(:detour)
      ...>
      ...> created_at =
      ...>   DateTime.utc_now()
      ...>   |> DateTime.shift(minute: 30)
      ...>   |> DateTime.to_unix()
      ...>
      ...> {:ok, result} =
      ...>   Notifications.Notification.create_detour_expiration_notification(%{
      ...>     detour: detour,
      ...>     expires_in: Duration.new!(minute: 30),
      ...>     estimated_duration: "1 hour",
      ...>     notification: %{
      ...>       created_at: created_at
      ...>     }
      ...>   })
      ...>
      ...> %Notifications.Db.DetourExpiration{
      ...>   detour_id: ^detour_id,
      ...>   notification: %Notifications.Db.Notification{created_at: ^created_at}
      ...> } = result
  """
  def create_detour_expiration_notification(params) when is_map(params) do
    create_detour_expiration_notification(Map.get(params, :detour), params)
  end

  def create_detour_expiration_notification(%Skate.Detours.Db.Detour{} = detour, params) do
    detour
    |> Ecto.build_assoc(:detour_expiration_notifications)
    |> Notifications.Db.DetourExpiration.changeset(params)
    |> Skate.Repo.insert()
    |> log_notification()
    |> broadcast_notification(:all)
  end

  @doc """
  Creates a new Detour Status notification for an deactivated detour and broadcasts to subscribed users.
  """
  def create_deactivated_detour_notification_from_detour(%Skate.Detours.Db.Detour{} = detour) do
    detour
    |> Ecto.build_assoc(:detour_status_notifications)
    |> Notifications.Db.Detour.changeset(%{
      status: :deactivated,
      notification: %{users: Skate.Settings.User.get_all()}
    })
    |> Skate.Repo.insert()
    |> log_notification()
    |> broadcast_notification(:all)
  end

  @doc """
  Creates a new Detour Status notification for an activated detour and broadcasts to subscribed users.
  """
  def create_activated_detour_notification_from_detour(%Skate.Detours.Db.Detour{} = detour) do
    detour
    |> Ecto.build_assoc(:detour_status_notifications)
    |> Notifications.Db.Detour.changeset(%{
      status: :activated,
      notification: %{users: Skate.Settings.User.get_all()}
    })
    |> Skate.Repo.insert()
    |> log_notification()
    |> broadcast_notification(:all)
  end

  @spec get_or_create_from_block_waiver(map()) :: t()
  def get_or_create_from_block_waiver(block_waiver_values) do
    changeset =
      DbNotification.block_waiver_changeset(
        %DbNotification{},
        block_waiver_values
      )

    db_record =
      case Skate.Repo.transaction(fn ->
             with {:ok, db_record} <- insert(changeset, on_conflict: :nothing),
                  false <- is_nil(db_record.id) do
               log_creation(db_record)

               link_notification_to_users(
                 db_record.id,
                 Map.fetch!(block_waiver_values, :route_ids)
               )

               db_record
             else
               _ -> Skate.Repo.rollback(nil)
             end
           end) do
        {:ok, db_record} when not is_nil(db_record) ->
          db_record

        {:error, _} ->
          Skate.Repo.one!(
            from(n in DbNotification,
              join: bw in assoc(n, :block_waiver),
              preload: [block_waiver: bw],
              where:
                bw.start_time == ^block_waiver_values.start_time and
                  bw.end_time == ^block_waiver_values.end_time and
                  bw.block_id == ^block_waiver_values.block_id and
                  bw.service_id == ^block_waiver_values.service_id and
                  bw.reason == ^block_waiver_values.reason
            )
          )
      end

    from_db_notification(db_record)
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
    |> Enum.map(&from_db_notification/1)
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

  defp log_creation(notification) do
    Logger.info("Notification created new_notification=#{inspect(notification)}")
  end

  defp link_notification_to_users(notification_id, notification_route_ids) do
    naive_now_fn = Application.get_env(:skate, :naive_now_fn, &Util.Time.naive_now/0)
    now = naive_now_fn.()
    user_ids = User.user_ids_for_route_ids(notification_route_ids)

    notification_user_maps =
      Enum.map(user_ids, fn user_id ->
        %{
          notification_id: notification_id,
          user_id: user_id,
          state: :unread,
          inserted_at: now,
          updated_at: now
        }
      end)

    Skate.Repo.insert_all(
      DbNotificationUser,
      notification_user_maps,
      on_conflict: :nothing
    )
  end

  @spec from_db_notification(DbNotification.t()) :: __MODULE__.t()
  defp from_db_notification(
         %DbNotification{} =
           db_notification
       ) do
    %__MODULE__{
      id: db_notification.id,
      created_at: db_notification.created_at,
      state: db_notification.state,
      content: content_from_db_notification(db_notification)
    }
  end

  defp content_from_db_notification(%DbNotification{
         block_waiver: %BlockWaiver{} = bw
       }) do
    bw
  end

  defp content_from_db_notification(%DbNotification{
         bridge_movement: %BridgeMovement{} = bm
       }) do
    bm
  end

  defp content_from_db_notification(%DbNotification{
         detour: %Notifications.Db.Detour{} = detour
       }) do
    detour
  end

  defp content_from_db_notification(%DbNotification{
         detour_expiration: %Notifications.Db.DetourExpiration{} = detour_expiration
       }) do
    # `Jason` doesn't know how to encode a `%Duration{}`, or tuples
    # like the `:microsecond` field.
    update_in(
      detour_expiration.expires_in,
      &convert_duration_to_valid_minutes/1
    )
  end

  # Expects a limited set of results from the database and converts those into
  # known durations for the frontend
  defp convert_duration_to_valid_minutes(%Duration{
         year: 0,
         month: 0,
         week: 0,
         day: 0,
         hour: 0,
         minute: 0,
         second: seconds,
         microsecond: {0, _}
       }) do
    case seconds do
      1800 ->
        # minutes
        30

      0 ->
        # minutes
        0

      seconds ->
        Logger.error("unknown seconds value second=#{seconds}")
        # The frontend expects either `0` or `30`,
        # `0` seems like a safer default _for now_.
        0
    end
  end
end
