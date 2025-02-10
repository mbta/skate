defmodule Skate.Repo.Migrations.BackfillDetourStatus.MigratingSchema do
  @moduledoc """
  Detours database table schema frozen at this point in time.
  """

  use Skate.Schema

  typed_schema "detours" do
    field :state, :map

    field(:status, Ecto.Enum, values: [:draft, :active, :past])

    timestamps()
  end
end

defmodule Skate.Repo.Migrations.BackfillDetourStatus do
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
      r in Skate.Repo.Migrations.BackfillDetourStatus.MigratingSchema,
      select: r.id,
      where: r.id > ^last_id,
      order_by: [asc: r.id],
      limit: @batch_size
    )
  end

  defp do_change(batch_of_ids) do
    from(
      r in Skate.Repo.Migrations.BackfillDetourStatus.MigratingSchema,
      select: [:id, :state],
      where: r.id in ^batch_of_ids
    )
    |> repo().all(log: :info)
    |> Enum.map(fn %Skate.Repo.Migrations.BackfillDetourStatus.MigratingSchema{
                     id: id,
                     state: state
                   } = detour ->
      detour
      |> Ecto.Changeset.change()
      # Note: not sure if we should use the _current_ `categorize_detour`
      # function in this or "vendor" it into this file
      |> Ecto.Changeset.put_change(
        :status,
        categorize_detour_frozen(state)
      )
      |> repo().update()
      |> case do
        {:error, _changeset} -> raise "#{id} was not updated"
        {:ok, %{id: changed_id}} -> changed_id
      end
    end)
    |> (fn changed -> {:ok, changed} end).()
  end

  # "Vendored" version of `categorize_detour` at this current point in time.
  defp categorize_detour_frozen(%{"value" => %{"Detour Drawing" => %{"Active" => _}}}),
    do: :active

  defp categorize_detour_frozen(%{"value" => %{"Detour Drawing" => "Past"}}),
    do: :past

  defp categorize_detour_frozen(_detour_context), do: :draft

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
