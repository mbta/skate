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
    belongs_to :author, User
    belongs_to :copied_from, __MODULE__, foreign_key: :copied_from_id

    # State properties
    field :state, :map
    field(:status, Ecto.Enum, values: [:draft, :active, :past]) :: status()
    field :activated_at, :utc_datetime_usec
    timestamps()
    field :is_text_only, :boolean, default: false
    field :undo_stack, {:array, :map}
    field :snapshot_children, :map
    field :state_value, :map

    # Activation properties
    field :estimated_duration, :string
    field :reason, :string
    field :swiftly_id, :string

    # Map point properties
    field :start_point, :map
    field :end_point, :map
    field :waypoints, {:array, :map}
    field :coordinates, {:array, :map}

    # Route properties
    field :route_id, :string
    field :route_name, :string
    field :garages, {:array, :string}
    field :direction_names, :map
    field :route_patterns, {:array, :map}
    field :route_pattern_id, :string
    field :route_pattern_name, :string
    field :headsign, :string
    field :direction, :string
    field :direction_id, :integer, virtual: true
    field :route_pattern, :map, virtual: true

    # Detour shape properties
    field :nearest_intersection, :string
    field :missed_stops, {:array, :map}
    field :connection_points, :map
    field :route_segments, :map
    field :typed_detour, :map
    field :detour_shape, :map
    field :edited_directions, :string

    has_many :detour_status_notifications, Notifications.Db.Detour
    has_many :detour_expiration_notifications, Notifications.Db.DetourExpiration
  end

  def changeset(detour, attrs) do
    detour
    |> cast(attrs, [:state, :activated_at, :swiftly_id])
    |> validate_activated_at()
    |> add_status()
    |> populate_fields_from_state()
    |> add_updated_at()
    |> validate_required([:state, :status])
    |> foreign_key_constraint(:author_id)
  end

  def copy_to_draft_changeset(new_detour, source) do
    copied_fields =
      source
      |> Map.from_struct()
      |> Map.drop([
        # clear detour specific properties
        :__meta__,
        :id,
        :inserted_at,
        :updated_at,
        :copied_from,
        :copied_from_id,
        :author,
        :author_id,
        :detour_status_notifications,
        :detour_expiration_notifications,
        # "deactivate" detour
        :activated_at,
        :estimated_duration,
        :reason,
        :swiftly_id
      ])
      |> Map.merge(%{
        status: :draft,
        state: copy_to_draft_state(source.state),
        state_value: %{"SaveState" => "Saved", "Detour Drawing" => "Share Detour"}
      })

    change(new_detour, copied_fields)
  end

  defp copy_to_draft_state(state) do
    state
    |> Map.put(
      "context",
      state["context"]
      |> Map.merge(%{"status" => "draft"})
      |> Map.drop(["selectedReason", "selectedDuration", "activatedAt"])
    )
    |> Map.put("value", %{SaveState: "Saved", "Detour Drawing": "Share Detour"})
  end

  def set_state_uuid_changeset(detour) do
    new_state = put_in(detour.state, ["context", "uuid"], detour.id)
    change(detour, %{state: new_state})
  end

  # Add or update swiftly_id
  def put_change_from_swiftly({:ok, %{adjustmentId: swiftly_id}}, changeset) do
    put_change(changeset, :swiftly_id, swiftly_id)
  end

  # Remove swiftly_id on deactivation
  def put_change_from_swiftly({:ok, nil}, changeset) do
    put_change(changeset, :swiftly_id, nil)
  end

  # Make no change
  def put_change_from_swiftly(:ok, changeset) do
    changeset
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

  @state_fields %{
    state_value: ["value"],
    snapshot_children: ["children"],
    undo_stack: ["context", "undoStack"],
    estimated_duration: ["context", "selectedDuration"],
    route_patterns: ["context", "routePatterns"],
    garages: ["context", "route", "garages"],
    reason: ["context", "selectedReason"],
    direction_names: ["context", "route", "directionNames"],
    edited_directions: ["context", "editedDirections"],
    detour_shape: ["context", "detourShape"],
    route_name: ["context", "route", "name"],
    route_pattern_id: ["context", "routePattern", "id"],
    route_pattern_name: ["context", "routePattern", "name"],
    headsign: ["context", "routePattern", "headsign"],
    is_text_only: ["context", "isTextOnly"],
    route_id: ["context", "route", "id"]
  }

  @nullable_state_fields %{
    nearest_intersection: ["context", "nearestIntersection"],
    route_segments: ["context", "finishedDetour", "routeSegments"],
    connection_points: ["context", "finishedDetour", "connectionPoint"],
    missed_stops: ["context", "finishedDetour", "missedStops"],
    start_point: ["context", "startPoint"],
    end_point: ["context", "endPoint"],
    waypoints: ["context", "waypoints"],
    typed_detour: ["context", "typedDetour"],
    coordinates: ["context", "detourShape", "ok", "coordinates"]
  }

  defp put_change_from_state(changeset, field, path, allow_nil?) do
    with {:data, table_value} <- fetch_field(changeset, field),
         {:ok, state} <- fetch_change(changeset, :state),
         context_value <- get_in(state, path),
         true <- table_value != context_value,
         true <- allow_nil? or not is_nil(context_value) do
      put_change(changeset, field, context_value)
    else
      _ -> changeset
    end
  end

  defp put_changes_from_state(changeset, fields, allow_nil?) do
    Enum.reduce(fields, changeset, fn {field, path}, acc ->
      put_change_from_state(acc, field, path, allow_nil?)
    end)
  end

  defp populate_fields_from_state(changeset) do
    changeset
    |> put_changes_from_state(@state_fields, false)
    |> put_changes_from_state(@nullable_state_fields, true)
    |> populate_direction_from_state()
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

  def with_virtual_fields(detour) do
    detour
    |> put_route_pattern()
    |> put_direction_id()
  end

  defp put_route_pattern(%{route_patterns: route_patterns, route_pattern_id: id} = detour) do
    route_pattern =
      Enum.find(route_patterns, &(&1["id"] == id))

    %{detour | route_pattern: route_pattern}
  end

  defp put_route_pattern(detour), do: detour

  defp put_direction_id(%{route_pattern: route_pattern} = detour) do
    direction_id = route_pattern["directionId"]
    %{detour | direction_id: direction_id}
  end

  defp put_direction_id(detour), do: detour

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
        estimated_duration: d.estimated_duration,
        reason: d.reason,
        nearest_intersection: d.nearest_intersection,
        route_id: d.route_id,
        route_name: d.route_name,
        route_pattern_id: d.route_pattern_id,
        route_pattern_name: d.route_pattern_name,
        headsign: d.headsign,
        direction: d.direction,
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
