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

    field :status, Ecto.Enum, values: [:activated]

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

    @doc """
    Retrieves detour information for notifications from the `Notifications.Db.Detour` table

    ## Examples

        iex> :detour
        ...> |> insert()
        ...> |> Notifications.Notification.create_activated_detour_notification_from_detour()
        ...>
        iex> all_detour_notifications =
        ...>   Notifications.Db.Detour.Queries.get_derived_info()
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
    def get_derived_info(query \\ base()) do
      from(
        [detour_notification: dn] in query,
        left_join: ad in assoc(dn, :detour),
        as: :associated_detour,
        select_merge: %{
          route: ad.state["context"]["route"]["name"],
          origin: ad.state["context"]["routePattern"]["name"],
          headsign: ad.state["context"]["routePattern"]["headsign"],

          # Ecto can't figure out how to index a JSON map via another JSON value
          # because (in the ways it was tried) Ecto won't allow us to use the
          # value from the associated detour, `ad`, as a value in the
          # ["JSON path"](https://hexdocs.pm/ecto/Ecto.Query.API.html#json_extract_path/2).
          #
          # i.e., this
          #   ad.state["context"]["route"]["directionNames"][
          #      ad.state["context"]["routePattern"]["directionId"]
          #   ]
          #
          # But, Postgres _is_ able to do this, _if_ we get the types correct.
          # A JSON value in Postgres is either of type JSON or JSONB, but
          # - indexing a JSON array requires an `INTEGER`,
          # - accessing a JSON map, requires Postgres's `TEXT` type.
          #
          # So because we know the `directionId` will correspond to the keys in
          # `directionNames`, casting the `directionId` to `TEXT` allows us to
          # access the `directionNames` JSON map
          direction:
            fragment(
              "? -> CAST(? AS TEXT)",
              ad.state["context"]["route"]["directionNames"],
              ad.state["context"]["routePattern"]["directionId"]
            )
        }
      )
    end
  end
end
