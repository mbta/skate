defmodule Notifications.Db.Detour do
  @moduledoc """
  Ecto Model for Detour Notifications struct and Database table
  """

  use Skate.Schema

  @derive {Jason.Encoder,
           only: [
             :__struct__,
             :detour_id,
             :status,
             :headsign,
             :route,
             :direction,
             :origin
           ]}

  typed_schema "detour_notifications" do
    belongs_to :detour, Skate.Detours.Db.Detour
    has_one :notification, Notifications.Db.Notification

    field :status, Ecto.Enum, values: [:activated, :deactivated]

    # Derived from the associated detour
    field :headsign, :any, virtual: true
    field :route, :any, virtual: true
    field :direction, :any, virtual: true
    field :origin, :any, virtual: true
  end

  # Notifications are not created from external input, so there is no changeset function

  defmodule Queries do
    @moduledoc """
    Defines composable queries for retrieving `Notifications.Db.Detour` info.
    """

    import Ecto.Query

    @doc """
    The "base" query that queries `Notifications.Db.Detour`'s without restriction


    ## Examples

    The `base` query returns all Detour Notifications

        iex> :detour
        ...> |> insert()
        ...> |> Notifications.Notification.create_activated_detour_notification_from_detour()
        ...>
        iex> all_detour_notifications =
        ...>   Notifications.Db.Detour.Queries.base()
        ...>   |> Skate.Repo.all()
        ...>
        iex> match?(
        ...>   [
        ...>     %Notifications.Db.Detour{}
        ...>   ],
        ...>   all_detour_notifications
        ...> )
        true

    """
    def base() do
      from(d in Notifications.Db.Detour, as: :detour_notification, select_merge: d)
    end

    def with_detour(query \\ base()) do
      with_named_binding(query, :detour, fn query, binding ->
        join(query, :left, [detour_notification: n], assoc(n, ^binding), as: ^binding)
      end)
    end

    @doc """
    Retrieves detour information for notifications from the `Notifications.Db.Detour` table

    ## Examples

        iex> :detour
        ...> |> insert()
        ...> |> Notifications.Notification.create_activated_detour_notification_from_detour()
        ...>
        iex> all_detour_notifications =
        ...>   Notifications.Db.Detour.Queries.select_detour_notification_info()
        ...>   |> Skate.Repo.all()
        ...>
        iex> [
        ...>   %Notifications.Db.Detour{
        ...>    route: route,
        ...>    origin: origin,
        ...>    headsign: headsign,
        ...>    direction: direction
        ...>   }
        ...> ] = all_detour_notifications
        iex> Enum.any?([route, origin, headsign, direction], &is_nil/1)
        false

    """
    def select_detour_notification_info(query \\ base()) do
      query
      |> with_detour()
      |> Skate.Detours.Db.Detour.Queries.select_route_name(:route)
      |> Skate.Detours.Db.Detour.Queries.select_route_pattern_name(:origin)
      |> Skate.Detours.Db.Detour.Queries.select_route_pattern_headsign(:headsign)
      |> Skate.Detours.Db.Detour.Queries.select_direction(:direction)
    end
  end
end
