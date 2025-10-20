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

    # When this detour was activated
    field :activated_at, :utc_datetime_usec

    timestamps()

    ## Detour virtual fields
    # -------------------------------------------------------

    # Route properties
    field :route_id, :string, virtual: true
    field :route_name, :string, virtual: true
    field :route_pattern_id, :string, virtual: true
    field :route_pattern_name, :string, virtual: true
    field :headsign, :string, virtual: true
    field :direction, :string, virtual: true
    field :direction_id, :integer, virtual: true
    field :coordinates, {:array, :map}, virtual: true

    # Default detour properties
    field :nearest_intersection, :string, virtual: true

    # Activated properties
    field :estimated_duration, :string, virtual: true

    # -------------------------------------------------------

    has_many :detour_status_notifications, Notifications.Db.Detour
    has_many :detour_expiration_notifications, Notifications.Db.DetourExpiration
  end

  def changeset(detour, attrs) do
    detour
    |> cast(attrs, [:state, :activated_at])
    |> validate_activated_at()
    |> add_status()
    |> validate_required([:state, :status])
    |> foreign_key_constraint(:author_id)
  end

  def update_copied_detour_state_changeset(detour) do
    new_state =
      detour.state
      |> Map.put(
        "context",
        detour.state["context"]
        |> Map.merge(%{"uuid" => detour.id})
        |> Map.drop(["selectedReason", "selectedDuration", "activatedAt"])
      )
      |> Map.put("status", "draft")
      |> Map.put("value", %{
        SaveState: "Saved",
        "Detour Drawing": "Share Detour"
      })

    detour
    |> change(%{activated_at: nil})
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
    Builds a query that _selects_ data from columns or extracts from the JSON `:state`.

    **IMPORTANT**: When filtering fields for associations, you
    MUST include the foreign keys used in the relationship,
    otherwise Ecto will be unable to find associated records.
    """
    def select_fields(query \\ base(), fields)

    def select_fields(query, :all),
      do: select_fields(query, Skate.Detours.Db.Detour.__schema__(:virtual_fields))

    def select_fields(query, fields) when is_list(fields) do
      %{virtual_fields: wanted_virtual_fields, fields: wanted_fields} = split_fields(fields)

      query
      |> add_author?(wanted_fields)
      |> select_merge(^wanted_fields)
      |> select_virtual_fields(wanted_virtual_fields)
    end

    defp split_fields(input_fields) do
      schema_virtual_fields = Skate.Detours.Db.Detour.__schema__(:virtual_fields)

      {virtual_fields, fields} =
        Enum.split_with(input_fields, fn field -> field in schema_virtual_fields end)

      %{
        virtual_fields: virtual_fields,
        fields: fields
      }
    end

    defp select_virtual_fields(query, fields) when is_list(fields) do
      Enum.reduce(fields, query, fn field, query ->
        case field do
          :route_id -> select_route_id(query)
          :route_name -> select_route_name(query)
          :route_pattern_id -> select_route_pattern_id(query)
          :route_pattern_name -> select_route_pattern_name(query)
          :headsign -> select_route_pattern_headsign(query)
          :direction -> select_direction(query)
          :nearest_intersection -> select_starting_intersection(query)
          :estimated_duration -> select_estimated_duration(query)
          :direction_id -> select_direction_id(query)
          :coordinates -> select_coordinates(query)
          _unknown -> query
        end
      end)
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
        join: a in assoc(d, :author),
        preload: [author: a]
      )
    end

    def select_detour_list_info(query \\ base()) do
      query
      |> select_fields([
        # Table Columns
        :id,
        :author_id,
        :activated_at,
        :updated_at,
        :status,

        # Virtual Fields
        :route_id,
        :route_name,
        :route_pattern_id,
        :route_pattern_name,
        :headsign,
        :direction,
        :nearest_intersection,
        :estimated_duration,

        # Nested Fields
        author: [:email, :id]
      ])
      |> sorted_by_last_updated()
    end

    def select_route_id(query \\ base(), key \\ :route_id) do
      select_merge(query, [detour: d], %{^key => d.state["context"]["route"]["id"]})
    end

    def select_route_name(query \\ base(), key \\ :route_name) do
      select_merge(query, [detour: d], %{^key => d.state["context"]["route"]["name"]})
    end

    def select_route_pattern_name(query \\ base(), key \\ :route_pattern_name) do
      select_merge(query, [detour: d], %{^key => d.state["context"]["routePattern"]["name"]})
    end

    def select_route_pattern_headsign(query \\ base(), key \\ :headsign) do
      select_merge(query, [detour: d], %{^key => d.state["context"]["routePattern"]["headsign"]})
    end

    def select_route_pattern_id(query \\ base(), key \\ :route_pattern_id) do
      select_merge(query, [detour: d], %{^key => d.state["context"]["routePattern"]["id"]})
    end

    def select_direction(query \\ base(), key \\ :direction) do
      select_merge(query, [detour: d], %{
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
        ^key =>
          fragment(
            "? -> CAST(? AS TEXT)",
            d.state["context"]["route"]["directionNames"],
            d.state["context"]["routePattern"]["directionId"]
          )
      })
    end

    def select_direction_id(query \\ base(), key \\ :direction_id) do
      select_merge(query, [detour: d], %{
        ^key => d.state["context"]["routePattern"]["directionId"]
      })
    end

    def select_starting_intersection(query \\ base(), key \\ :nearest_intersection) do
      select_merge(query, [detour: d], %{
        ^key => d.state["context"]["nearestIntersection"]
      })
    end

    def select_estimated_duration(query \\ base(), key \\ :estimated_duration) do
      select_merge(query, [detour: d], %{
        ^key => d.state["context"]["selectedDuration"]
      })
    end

    def select_coordinates(query \\ base(), key \\ :coordinates) do
      select_merge(query, [detour: d], %{
        ^key => d.state["context"]["detourShape"]["ok"]["coordinates"]
      })
    end
  end
end
