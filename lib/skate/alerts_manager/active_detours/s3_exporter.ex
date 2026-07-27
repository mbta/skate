defmodule Skate.AlertsManager.ActiveDetours.S3Exporter do
  @moduledoc """
  Save active detour information for Alerts Manager in AWS S3.
  """

  require Logger

  use Oban.Worker

  require Ecto.Query

  alias Skate.Detours.Db.Detour

  @impl Oban.Worker
  def perform(%Oban.Job{args: _}) do
    detours =
      Detour
      |> Ecto.Query.where(status: :active)
      |> Ecto.Query.order_by(desc: :activated_at)
      |> Skate.Repo.all()

    objects =
      Enum.map(detours, fn %Detour{} = detour ->
        %{
          id: detour.id,
          route_id: detour.route_id,
          reason: detour.reason,
          nearest_intersection: detour.nearest_intersection,
          estimated_duration: detour.estimated_duration,
          activated_at:
            case DateTime.from_naive(detour.activated_at, "Etc/UTC") do
              {:ok, datetime} -> DateTime.to_unix(datetime)
              _ -> nil
            end,
          updated_at:
            case DateTime.from_naive(detour.updated_at, "Etc/UTC") do
              {:ok, datetime} -> DateTime.to_unix(datetime)
              _ -> nil
            end,
          direction_id:
            get_in(
              detour.state,
              ["context", "routePattern", "directionId"]
            ),
          missed_stops:
            if detour.is_text_only do
              get_in(detour.state, ["context", "typedDetour", "missedStops"])
            else
              case get_in(detour.state, ["context", "finishedDetour", "missedStops"]) do
                nil ->
                  nil

                missed_stops when is_list(missed_stops) ->
                  missed_stops
                  |> Enum.map(fn %{} = missed_stop -> get_in(missed_stop, ["id"]) end)
                  |> Enum.reject(&is_nil/1)
              end
            end,
          connection_points:
            if detour.is_text_only do
              get_in(detour.state, ["context", "typedDetour", "connectionPoints"])
            else
              case get_in(detour.state, ["context", "finishedDetour", "connectionPoint"]) do
                nil ->
                  []

                connection_points when is_map(connection_points) ->
                  for point <- ["start", "end"] do
                    get_in(connection_points, [point, "id"])
                  end
                  |> Enum.reject(&is_nil/1)
              end
            end,
          route_segments:
            if detour.is_text_only do
              nil
            else
              %{
                before_detour:
                  get_in(
                    detour.state,
                    ["context", "finishedDetour", "routeSegments", "beforeDetour"]
                  ),
                after_detour:
                  get_in(
                    detour.state,
                    ["context", "finishedDetour", "routeSegments", "afterDetour"]
                  ),
                bypassed_segment:
                  get_in(
                    detour.state,
                    ["context", "finishedDetour", "detourShape", "coordinates"]
                  ),
                detour_segment:
                  get_in(
                    detour.state,
                    ["context", "finishedDetour", "routeSegments", "detour"]
                  )
              }
            end
        }
      end)

    content =
      objects
      |> Enum.map(fn object ->
        case Jason.encode(object) do
          {:ok, json} ->
            json <> "\n"

          {:error, _} ->
            nil
        end
      end)
      |> Enum.reject(&is_nil/1)
      |> Enum.join("")

    # TODO: use s3 instead of local file after bucket is provisioned
    # case ExAws.S3.put_object(
    #         System.get_env("SKATE_S3_BUCKET"),
    #         "detours/active.ndjson",
    #         content
    #       )
    #       |> ExAws.request() do
    #   {:ok, :done} ->
    #     :ok
    #   {:error, reason} ->
    #     {:error, reason}
    # end

    case File.write(Path.relative_to_cwd("detours.ndjson"), content) do
      :ok -> :ok
      {:error, reason} -> {:error, reason}
    end
  end
end
