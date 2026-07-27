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

    case Application.get_env(:skate, :s3_bucket) do
      nil ->
        Logger.info(inspect(objects))
        {:ok, length(objects)}

      bucket when is_binary(bucket) ->
        case ExAws.request(
               ExAws.S3.put_object(bucket, "detours/active.ndjson", content),
               Application.get_env(:ex_aws, :request_config_overrides)
             ) do
          {:ok, _} ->
            :telemetry.execute(
              [:skate, :alerts_manager, :active_detours, :s3_exporter, :ok],
              %{count: length(objects)},
              %{}
            )

            {:ok, length(objects)}

          {:error, %{reason: reason}} ->
            :telemetry.execute(
              [:skate, :alerts_manager, :active_detours, :s3_exporter, :error],
              %{},
              %{reason: reason}
            )

            {:error, reason}
        end
    end
  end

  def attach_telemetry(
        label \\ "skate.alerts_manager.active_detours.s3_exporter",
        config \\ []
      ) do
    events =
      for event <- [:start, :stop, :exception] do
        [:oban, :job, event]
      end ++
        for event <- [:ok, :error] do
          [:skate, :alerts_manager, :active_detours, :s3_exporter, event]
        end

    :telemetry.attach_many(label, events, &handle_telemetry_event/4, config)
  end

  def handle_telemetry_event(_, _, _, _)

  def handle_telemetry_event(
        [:skate, :alerts_manager, :active_detours, :s3_exporter, :ok],
        measurements,
        _metadata,
        _
      ) do
    Logger.notice(
      "[skate:alerts_manager:active_detours:s3_exporter] ok: " <>
        "exported #{measurements.count} detours"
    )
  end

  def handle_telemetry_event(
        [:skate, :alerts_manager, :active_detours, :s3_exporter, :error],
        _measurements,
        metadata,
        _
      ) do
    Logger.notice(
      "[skate:alerts_manager:active_detours:s3_exporter] error: " <>
        inspect(metadata)
    )
  end

  def handle_telemetry_event([:oban, :job, :start], measurements, metadata, _) do
    Logger.notice(
      "[oban] start: " <>
        "worker #{metadata.worker} started at #{measurements.system_time}"
    )
  end

  def handle_telemetry_event([:oban, :job, event], measurements, metadata, _) do
    Logger.notice(
      "[oban] #{event}: " <>
        "worker #{metadata.worker} elapsed #{measurements.duration} ms"
    )
  end
end
