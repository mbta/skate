defmodule Skate.Repo.Migrations.BackfillFromDetourState.MigratingSchema do
  use Skate.Schema

  typed_schema "detours" do
    field :state, :map, null: true
    field :coordinates, {:array, :map}, null: true
    field :nearest_intersection, :string, null: true
    field :start_point, :map, null: true
    field :end_point, :map, null: true
    field :waypoints, {:array, :map}, null: true
    field :reason, :string, null: true
    field :estimated_duration, :string, null: true
    field :headsign, :string, null: true
    field :route_id, :string, null: true
    field :route_name, :string, null: true
    field :direction, :string, null: true
    field :route_pattern_id, :string, null: true
    field :route_pattern_name, :string, null: true
  end
end

defmodule Skate.Repo.Migrations.BackfillFromDetourState do
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
      r in Skate.Repo.Migrations.BackfillFromDetourState.MigratingSchema,
      select: r.id,
      where: r.id > ^last_id,
      order_by: [asc: r.id],
      limit: @batch_size
    )
  end

  defp do_change(batch_of_ids) do
    from(
      r in Skate.Repo.Migrations.BackfillFromDetourState.MigratingSchema,
      select: [:id, :state],
      where: r.id in ^batch_of_ids
    )
    |> repo().all(log: :info)
    |> Enum.map(fn %Skate.Repo.Migrations.BackfillFromDetourState.MigratingSchema{
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

  defp map_fields(state) do
    direction_id = get_in(state, ["context", "routePattern", "directionId"])

    %{
      route_id: get_in(state, ["context", "route", "id"]),
      route_name: get_in(state, ["context", "route", "name"]),
      direction: get_in(state, ["context", "route", "directionNames", "#{direction_id}"]),
      route_pattern_id: get_in(state, ["context", "routePattern", "id"]),
      route_pattern_name: get_in(state, ["context", "routePattern", "name"]),
      headsign: get_in(state, ["context", "routePattern", "headsign"]),
      coordinates: get_in(state, ["context", "detourShape", "ok", "coordinates"]),
      nearest_intersection: get_in(state, ["context", "nearestIntersection"]),
      start_point: get_in(state, ["context", "startPoint"]),
      end_point: get_in(state, ["context", "endPoint"]),
      waypoints: get_in(state, ["context", "waypoints"]),
      reason: get_in(state, ["context", "selectedReason"]),
      estimated_duration: get_in(state, ["context", "selectedDuration"])
    }
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
