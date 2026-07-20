defmodule Skate.Repo.Migrations.BackfillDetourSwiftlyId.MigratingSchema do
  @moduledoc """
  Detours database table schema frozen at this point in time.
  """

  use Skate.Schema

  typed_schema "detours" do
    # field :id, :integer, null: false
    field :swiftly_id, :string, null: true
  end
end

defmodule Skate.Repo.Migrations.BackfillDetourSwiftlyId do
  # https://fly.io/phoenix-files/backfilling-data/

  import Ecto.Query
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true
  @batch_size 5
  @throttle_ms 100

  defp retry(f, n) when n > 0 do
    case f.() do
      [] -> retry(f, n - 1)
      val -> val
    end
  end

  defp retry(_f, 0), do: {:error, :unknown}

  defp load_swiftly_ids() do
    retry(fn -> Skate.Detours.Detours.get_swiftly_adjustments() end, 5)
  end

  def up do
    swiftly_id_map =
      load_swiftly_ids()
      |> dbg()
      |> Map.new(fn x -> {String.to_integer(x.notes), x.id} end)

    detour_ids = Map.keys(swiftly_id_map)

    Skate.Repo.transaction(fn ->
      Skate.Repo.Migrations.BackfillDetourSwiftlyId.MigratingSchema
      |> where([r], r.id in ^detour_ids)
      |> Skate.Repo.stream()
      |> Stream.chunk_every(@batch_size)
      |> Stream.each(fn batch ->
        Enum.each(batch, fn detour ->
          case Map.fetch(swiftly_id_map, detour.id) do
            {:ok, swiftly_id} ->
              Skate.Repo.get!(
                Skate.Repo.Migrations.BackfillDetourSwiftlyId.MigratingSchema,
                detour.id
              )
              |> Ecto.Changeset.change(swiftly_id: swiftly_id)
              |> Skate.Repo.update!()

            _ ->
              nil
          end
        end)

        Process.sleep(@throttle_ms)
      end)
      |> Stream.run()
    end)
  end

  def down do
    Skate.Repo.update_all(Skate.Repo.Migrations.BackfillDetourSwiftlyId.MigratingSchema,
      set: [swiftly_id: nil]
    )
  end
end
