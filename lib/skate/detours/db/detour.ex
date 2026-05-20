defmodule Skate.Detours.Db.Detour do
  @moduledoc """
  Ecto Model for `detours` Database table
  """

  use Skate.Schema
  import Ecto.Changeset

  alias Skate.Notifications
  alias Skate.Settings.Db.User

  @type status :: :active | :draft | :past

  typed_schema "detours" do
    field :state, :map

    field(:status, Ecto.Enum, values: [:draft, :active, :past]) :: status()

    belongs_to :author, User

    belongs_to :copied_from, __MODULE__, foreign_key: :copied_from_id

    # When this detour was activated
    field :activated_at, :utc_datetime_usec

    timestamps()

    # -------------------------------------------------------
    # Activated properties
    field :estimated_duration, :string
    field :reason, :string

    # -------------------------------------------------------
    # Map point properties
    field :start_point, :map
    field :end_point, :map
    field :waypoints, {:array, :map}
    field :coordinates, {:array, :map}

    # Route properties
    field :route_id, :string
    field :route_name, :string
    field :route_pattern_id, :string
    field :route_pattern_name, :string
    field :headsign, :string
    field :direction, :string
    field :is_text_only, :boolean, default: false

    # Default detour properties
    field :nearest_intersection, :string

    has_many :detour_status_notifications, Notifications.Db.Detour
    has_many :detour_expiration_notifications, Notifications.Db.DetourExpiration
  end

  def changeset(detour, attrs) do
    detour
    |> cast(attrs, [:state, :activated_at])
    |> validate_activated_at()
    |> add_status()
    |> prepare_changes(&populate_fields_from_state/1)
    |> add_updated_at()
    |> validate_required([:state, :status])
    |> foreign_key_constraint(:author_id)
  end

  def update_copied_detour_state_changeset(detour) do
    new_state =
      detour.state
      |> Map.put(
        "context",
        detour.state["context"]
        |> Map.merge(%{"uuid" => detour.id, "status" => "draft"})
        |> Map.drop(["selectedReason", "selectedDuration", "activatedAt"])
      )
      |> Map.put("value", %{
        SaveState: "Saved",
        "Detour Drawing": "Share Detour"
      })

    detour
    |> change(%{activated_at: nil, estimated_duration: nil, reason: nil})
    |> change(%{state: new_state})
  end

  defp validate_activated_at(changeset) do
    case fetch_change(changeset, :activated_at) do
      {:ok, nil} -> delete_change(changeset, :activated_at)
      _ -> changeset
    end
  end

  defp add_status(changeset) do
    case {fetch_field(changeset, :status), fetch_change(changeset, :state)} do
      {{:data, :active}, {:ok, %{"value" => %{"Detour Drawing" => "Past"}}}} ->
        put_change(changeset, :status, :past)

      {{:data, :draft}, {:ok, %{"value" => %{"Detour Drawing" => %{"Active" => _}}}}} ->
        put_change(changeset, :status, :active)

      {{:data, nil}, {:ok, _state}} ->
        put_change(changeset, :status, :draft)

      _ ->
        changeset
    end
  end

  # Do not update updated_at if the changeset only contains state changes
  defp add_updated_at(changeset) when map_size(changeset.changes) < 2 do
    changeset
  end

  defp add_updated_at(changeset) do
    case {fetch_field(changeset, :status), fetch_field(changeset, :activated_at)} do
      # Set updated_at to activated_at when first activating a detour
      {{:changes, :active}, {:changes, activated_at}} ->
        put_change(
          changeset,
          :updated_at,
          NaiveDateTime.truncate(DateTime.to_naive(activated_at), :second)
        )

      # Relies on snapshots being suppressed for changes to active detours
      {{:data, :active}, _} ->
        put_change(
          changeset,
          :updated_at,
          NaiveDateTime.truncate(NaiveDateTime.utc_now(), :second)
        )

      # Always update timestamp for drafts
      {{:data, :draft}, _} ->
        put_change(
          changeset,
          :updated_at,
          NaiveDateTime.truncate(NaiveDateTime.utc_now(), :second)
        )

      _ ->
        changeset
    end
  end

  defp put_change_from_state(changeset, field, path) do
    case {fetch_field(changeset, field), fetch_change(changeset, :state)} do
      {{:data, _}, {:ok, state}} ->
        case get_in(state, path) do
          nil -> changeset
          value -> put_change(changeset, field, value)
        end

      _ ->
        changeset
    end
  end

  defp populate_fields_from_state(changeset) do
    changeset
    |> put_change_from_state(:estimated_duration, ["context", "selectedDuration"])
    |> put_change_from_state(:reason, ["context", "selectedReason"])
    |> put_change_from_state(:nearest_intersection, ["context", "nearestIntersection"])
    |> put_change_from_state(:start_point, ["context", "startPoint"])
    |> put_change_from_state(:end_point, ["context", "endPoint"])
    |> put_change_from_state(:waypoints, ["context", "waypoints"])
    |> put_change_from_state(:route_id, ["context", "route", "id"])
    |> put_change_from_state(:route_name, ["context", "route", "name"])
    |> put_change_from_state(:route_pattern_id, ["context", "routePattern", "id"])
    |> put_change_from_state(:route_pattern_name, ["context", "routePattern", "name"])
    |> put_change_from_state(:headsign, ["context", "routePattern", "headsign"])
    |> put_change_from_state(:is_text_only, ["context", "isTextOnly"])
    |> populate_coordinates_from_state()
    |> populate_direction_from_state()
  end

  defp populate_coordinates_from_state(changeset) do
    case {fetch_field(changeset, :coordinates), fetch_change(changeset, :state)} do
      {{:data, _},
       {:ok, %{"context" => %{"detourShape" => %{"ok" => %{"coordinates" => coordinates}}}}}} ->
        put_change(changeset, :coordinates, coordinates)

      _ ->
        changeset
    end
  end

  defp populate_direction_from_state(changeset) do
    case {fetch_field(changeset, :direction), fetch_change(changeset, :state)} do
      {{:data, _},
       {:ok,
        %{
          "context" => %{
            "route" => %{"directionNames" => direction_names},
            "routePattern" => %{"directionId" => direction_id}
          }
        }}} ->
        put_change(changeset, :direction, direction_names["#{direction_id}"])

      _ ->
        changeset
    end
  end

  defmodule Queries do
    @moduledoc """
    Defines composable queries for retrieving `Skate.Detours.Db.Detour`
    """

    import Ecto.Query

    def base() do
      # Select nothing (`[]`) at first so further `select_merge`'s
      # don't have an issue
      from(Skate.Detours.Db.Detour, as: :detour, select: [])
    end

    @doc """
    Builds a query that _selects_ data from columns.

    **IMPORTANT**: When filtering fields for associations, you
    MUST include the foreign keys used in the relationship,
    otherwise Ecto will be unable to find associated records.
    """
    def select_fields(query \\ base(), fields)

    def select_fields(query, :all) do
      select_fields(query, Skate.Detours.Db.Detour.__schema__(:fields))
    end

    def select_fields(query, fields) when is_list(fields) do
      query
      |> add_author?(fields)
      |> select_merge(^fields)
    end

    def sorted_by_last_updated(query \\ base()) do
      order_by(query, desc: :updated_at)
    end

    defp add_author?(query, fields) do
      if Keyword.has_key?(fields, :author) do
        with_author(query)
      else
        query
      end
    end

    @doc """
    Joins the `Skate.Settings.Db.User` struct into the `Skate.Detours.Db.Detour`
    via Ecto preload.

    > ### Primary Keys required in query when using `with_author/1` {:.warning}
    > When preloading structs, Ecto requires that primary key fields are also
    > queried on all preloaded structs.
    > This means that when querying `:author` via `select_fields`, you need to
    > explicitly request `:id` on both the `Skate.Detours.Db.Detour` and the
    > `Skate.Settings.Db.User`.
    """
    def with_author(query \\ base()) do
      from([detour: d] in query,
        join: a in assoc(d, :author)
      )
    end

    def select_detour_list_info(query \\ from(Skate.Detours.Db.Detour, as: :detour)) do
      query
      |> with_author()
      |> select([d, a], %{
        id: d.id,
        author_id: d.author_id,
        activated_at: d.activated_at,
        updated_at: d.updated_at,
        status: d.status,
        state: d.state,
        estimated_duration: d.estimated_duration,
        reason: d.reason,
        nearest_intersection: d.nearest_intersection,
        route_id: d.route_id,
        route_name: d.route_name,
        route_pattern_id: d.route_pattern_id,
        route_pattern_name: d.route_pattern_name,
        headsign: d.headsign,
        direction: d.direction,
        coordinates: d.coordinates,
        is_text_only: d.is_text_only,
        author: %{
          email: a.email,
          id: a.id
        }
      })
      |> sorted_by_last_updated()
    end
  end
end
