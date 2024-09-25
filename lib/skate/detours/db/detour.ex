defmodule Skate.Detours.Db.Detour do
  @moduledoc """
  Ecto Model for `detours` Database table
  """

  use Skate.Schema
  import Ecto.Changeset

  alias Skate.Settings.Db.User

  @type status :: :active | :draft | :past

  typed_schema "detours" do
    field :state, :map

    field(:status, Ecto.Enum, values: [:draft, :active, :past]) :: status()

    belongs_to :author, User

    # When this detour was activated
    field :activated_at, :utc_datetime_usec

    timestamps()
  end

  def changeset(detour, attrs) do
    detour
    |> cast(attrs, [:state, :activated_at])
    |> add_status()
    |> validate_required([:state, :status])
    |> foreign_key_constraint(:author_id)
  end

  defp add_status(changeset) do
    case fetch_change(changeset, :state) do
      {:ok, state} ->
        # Once this column is added for all detours, `categorize_detour` logic
        # should be moved here and should not be needed anymore
        put_change(changeset, :status, Skate.Detours.Detours.categorize_detour(%{state: state}))

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
  end
end
