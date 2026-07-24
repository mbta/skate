defmodule Skate.AlertsManager.Detours.S3Exporter do
  use Oban.Worker

  require Ecto.Query
  require Ecto.Changeset

  alias Skate.AlertsManager.Detours.ActiveDetour
  alias Skate.Detours.Db.Detour

  @impl Oban.Worker
  def perform(%Oban.Job{} = _) do
    # Fetch database records
    rows =
      Detour
      |> Ecto.Query.where(status: :active)
      |> Ecto.Query.order_by(desc: :activated_at)
      |> Skate.Repo.all()

    # Extract relevant data
    detours =
      rows
      |> Enum.map(fn (%Detour{} = row) ->
        %{
          id: row.id,
          route_id: row.route_id,
          reason: row.reason,
          nearest_intersection: row.nearest_intersection,
          estimated_duration: row.estimated_duration,
          activated_at: row.activated_at,
          updated_at: row.updated_at,
        }
      end)
      |> Enum.map(fn attrs ->
        case (
          %ActiveDetour{}
          |> ActiveDetour.changeset(attrs)
          |> Ecto.Changeset.apply_action(:update)
        ) do
          {:ok, detour} ->
            detour
          {:error, _} ->
            nil
        end
      end)
      |> Enum.reject(&is_nil/1)

    # Serialize into NDJSON format
    contents =
      detours
      |> Enum.map(fn detour ->
        case Jason.encode(detour) do
          {:ok, json} ->
            json <> "\n"
          {:error, _} ->
            nil
        end
      end)
      |> Enum.reject(&is_nil/1)
      |> Enum.join("")

    # Save to S3
    case (
      ExAws.S3.put_object(
        System.get_env("SKATE_S3_BUCKET"),
        "detours/active.ndjson",
        contents
      )
      |> ExAws.request()
    ) do
      {:ok, :done} ->
        :ok
      {:error, reason} ->
        {:error, reason}
    end
  end
end
