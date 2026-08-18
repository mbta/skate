defmodule Skate.Repo.Migrations.BackfillSerializingSnapshot.MigratingSchema do
  @moduledoc """
  Detours database table schema frozen at this point in time.
  """

  use Skate.Schema

  typed_schema "detours" do
    field :state, :map, null: true
    field :state_value, :map, null: false
    field :state_children, :map, null: true
    field :undo_stack, {:array, :map}, default: [], null: false
    field :route_patterns, {:array, :map}, null: false
    field :route, :map, null: false
    field :edited_directions, :string, null: true
    field :detour_shape, :map, null: true
    field :route_segments, :map, null: true
    field :connection_points, :map, null: true
    field :missed_stops, {:array, :map}, null: true
  end
end

defmodule Skate.Repo.Migrations.BackfillSerializingSnapshot do
  # https://fly.io/phoenix-files/backfilling-data/

  import Ecto.Query
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true
  @batch_size 100
  @throttle_ms 100

  def up do
    throttle_change_in_batches(&page_query/1, &do_change/1)
  end

  def down, do: :ok

  defp page_query(last_id) do
    from(
      r in Skate.Repo.Migrations.BackfillSerializingSnapshot.MigratingSchema,
      select: r.id,
      where: r.id > ^last_id,
      order_by: [asc: r.id],
      limit: @batch_size
    )
  end

  defp do_change(batch_of_ids) do
    from(
      r in Skate.Repo.Migrations.BackfillSerializingSnapshot.MigratingSchema,
      select: [:id, :state],
      where: r.id in ^batch_of_ids
    )
    |> repo().all(log: :info)
    |> Enum.map(fn %Skate.Repo.Migrations.BackfillSerializingSnapshot.MigratingSchema{
                     id: id,
                     state: state
                   } = detour ->
      detour
      |> Ecto.Changeset.change(map_fields(state))
      |> repo().update()
      |> case do
        {:error, _changeset} -> raise "#{id} was not updated"
        {:ok, %{id: changed_id}} -> changed_id
      end
    end)
    |> (fn changed -> {:ok, changed} end).()
  end

  # func (field, func) -> Ecto.Changeset.put_change(field, func(changeset))

  defp map_fields(state) do
    %{
      state_value: get_in(state, ["value"]),
      state_children: get_in(state, ["children"]),
      undo_stack: get_in(state, ["context", "undoStack"]),
      route_patterns: get_in(state, ["context", "routePatterns"]),
      route: get_in(state, ["context", "route"]),
      edited_directions: get_in(state, ["context", "editedDirections"]),
      detour_shape: get_in(state, ["context", "detourShape"]),
      route_segments: get_in(state, ["context", "finishedDetour", "routeSegments"]),
      connection_points: get_in(state, ["context", "finishedDetour", "connectionPoints"]),
      missed_stops: get_in(state, ["context", "finishedDetour", "missedStops"])
    }
    |> Enum.reject(fn {_field, value} -> is_nil(value) end)
    |> Map.new()
  end

  defp throttle_change_in_batches(query_fun, change_fun, last_pos \\ 0)
  defp throttle_change_in_batches(_query_fun, _change_fun, nil), do: :ok

  defp throttle_change_in_batches(query_fun, change_fun, last_pos) do
    case repo().all(query_fun.(last_pos), log: :info, timeout: :infinity) do
      [] ->
        :ok

      ids ->
        case change_fun.(List.flatten(ids)) do
          {:ok, results} ->
            next_page = results |> Enum.reverse() |> List.first()
            Process.sleep(@throttle_ms)
            throttle_change_in_batches(query_fun, change_fun, next_page)

          error ->
            raise error
        end
    end
  end
end
