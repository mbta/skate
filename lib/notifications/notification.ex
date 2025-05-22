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

  # This "blackout" period is so that multiple unsynchronised Skate instances
  # don't duplicate their work when polling the bridge API
  @bridge_lowering_blackout 120
  @chelsea_st_bridge_route_ids ~w[112 743]

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
  Creates a new detour expiration notification

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
  end

  @doc """
  Inserts a new notification for an deactivated detour into the database
  and returns the detour notification with notification info.
  """
  def create_deactivated_detour_notification_from_detour(%Skate.Detours.Db.Detour{} = detour) do
    import Notifications.Db.Notification.Queries

    notification =
      deactivated_detour_notification(detour)
      |> unread_notifications_for_users(Skate.Settings.User.get_all())
      |> Skate.Repo.insert!()

    # We need the associated values in the Detour JSON, so query the DB with the
    # id to load the extra data.
    get_detour_notification(notification.id)
  end

  @doc """
  Inserts a new notification for an activated detour into the database
  and returns the detour notification with notification info.
  """
  def create_activated_detour_notification_from_detour(%Skate.Detours.Db.Detour{} = detour) do
    import Notifications.Db.Notification.Queries

    notification =
      activated_detour_notification(detour)
      |> unread_notifications_for_users(Skate.Settings.User.get_all())
      |> Skate.Repo.insert!()

    # We need the associated values in the Detour JSON, so query the DB with the
    # id to load the extra data.
    get_detour_notification(notification.id)
  end

  def get_detour_notification(notification_id) do
    import Notifications.Db.Notification.Queries

    select_detour_info()
    |> where([notification: n], n.id == ^notification_id)
    |> Skate.Repo.one!()
    |> from_db_notification()
  end

  # Creates a new notification set to the current time
  defp new_notification_now() do
    %Notifications.Db.Notification{
      created_at: DateTime.to_unix(DateTime.utc_now())
    }
  end

  # Adds a activated detour notification relation to a `Notifications.Db.Notification`
  defp activated_detour_notification(%Skate.Detours.Db.Detour{} = detour) do
    %Notifications.Db.Notification{
      new_notification_now()
      | detour: Notifications.Detour.activated_detour(detour)
    }
  end

  # Adds a deactivated detour notification relation to a `Notifications.Db.Notification`
  defp deactivated_detour_notification(%Skate.Detours.Db.Detour{} = detour) do
    %Notifications.Db.Notification{
      new_notification_now()
      | detour: Notifications.Detour.deactivated_detour(detour)
    }
  end

  defp notification_for_user(%Skate.Settings.Db.User{} = user) do
    %Notifications.Db.NotificationUser{
      user: user
    }
  end

  defp unread_notification(%Notifications.Db.NotificationUser{} = user_notification) do
    %{
      user_notification
      | state: :unread
    }
  end

  defp unread_notifications_for_users(%Notifications.Db.Notification{} = notification, users) do
    %{
      notification
      | notification_users:
          for user <- users do
            user
            |> notification_for_user()
            |> unread_notification()
          end
    }
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

  def get_or_create_from_bridge_movement(bridge_movement_values) do
    created_at = DateTime.to_unix(DateTime.utc_now())

    {:ok, db_record} =
      Skate.Repo.transaction(fn ->
        Skate.Repo.query!("LOCK TABLE bridge_movements")

        # The bridge API doesn't have anything like an "updated at" timestamp
        # so we assume that, if we see two bridge movements within a blackout
        # period, they are actually the same movement and what's happening is
        # that we have multiple servers trying to insert a movement at once.
        cutoff_time = NaiveDateTime.add(NaiveDateTime.utc_now(), -@bridge_lowering_blackout)

        existing_record =
          Skate.Repo.one(
            from(n in DbNotification,
              join: bm in assoc(n, :bridge_movement),
              preload: [bridge_movement: bm],
              where:
                bm.inserted_at > ^cutoff_time and bm.status == ^bridge_movement_values[:status],
              order_by: [desc: bm.inserted_at],
              limit: 1
            )
          )

        if existing_record do
          existing_record
        else
          changeset =
            DbNotification.bridge_movement_changeset(
              %DbNotification{created_at: created_at},
              bridge_movement_values
            )

          {:ok, new_record} = Skate.Repo.insert(changeset, returning: true)
          link_notification_to_users(new_record.id, @chelsea_st_bridge_route_ids)
          log_creation(new_record)
          new_record
        end
      end)

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
