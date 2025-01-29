defmodule Skate.Detours.Db.Detour do
  @moduledoc """
  Ecto Model for `detours` Database table
  """

  use Skate.Schema
  import Ecto.Changeset

  alias Skate.Settings.Db.User

  typed_schema "detours" do
    field :state, :map
    belongs_to :author, User

    # When this detour was activated
    field :activated_at, :utc_datetime_usec

    timestamps()

    ## Detour virtual fields
    # -------------------------------------------------------
    field :status, Ecto.Enum, values: [:draft, :active, :past], virtual: true

    # Route properties
    field :route_id, :string, virtual: true
    field :route_name, :string, virtual: true
    field :route_pattern_id, :string, virtual: true
    field :route_pattern_name, :string, virtual: true
    field :headsign, :string, virtual: true
    field :direction, :string, virtual: true

    # Default detour properties
    field :nearest_intersection, :string, virtual: true

    # Activated properties
    field :estimated_duration, :string, virtual: true

    # Temporary field to make querying the `:state` faster and avoid needing to
    # pull the entire `:state` value
    field :state_value, :map, virtual: true

    # -------------------------------------------------------
  end

  def changeset(detour, attrs) do
    detour
    |> cast(attrs, [:state, :activated_at])
    |> validate_required([:state])
    |> foreign_key_constraint(:author_id)
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
    """
    def select_fields(query \\ base(), fields) when is_list(fields) do
      %{virtual_fields: wanted_virtual_fields, fields: wanted_fields} = split_fields(fields)

      query
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

    def select_virtual_fields(query \\ base(), fields) when is_list(fields) do
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
          :state_value -> select_state_value(query, :state_value)
          _unknown -> query
        end
      end)
    end

    def sorted_by_last_updated(query \\ base()) do
      order_by(query, desc: :updated_at)
    end

    def with_author(query \\ base(), key \\ :author) do
      from([detour: d] in query,
        join: a in assoc(d, :author),
        as: :author,
        select_merge: %{^key => a}
      )
    end

    def select_detour_list_info(query \\ base()) do
      query
      |> preload([
        :author
      ])
      |> select_fields([
        # Table Columns
        :id,
        :author_id,
        :activated_at,
        :updated_at,

        # Virtual Fields
        :route_id,
        :route_name,
        :route_pattern_id,
        :route_pattern_name,
        :headsign,
        :direction,
        :nearest_intersection,
        :estimated_duration,
        :state_value,

        # Nested Fields
        author: [:email]
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

    def select_state_value(query \\ base(), key \\ :state_value) do
      select_merge(query, [detour: d], %{^key => %{"value" => d.state["value"]}})
    end
  end
end
