defmodule Skate.AlertsManager.ActiveDetours.S3Exporter do
  @moduledoc """
  Save active detour information for Alerts Manager in AWS S3.
  """

  require Logger

  use Oban.Worker, max_attempts: 3

  require Ecto.Query

  alias Skate.Detours.Db.Detour

  @telemetry_handler_id "skate.alerts_manager.active_detour.s3_exporter"

  def attach_telemetry_handler(config \\ []) do
    events =
      for event <- [:start, :stop, :exception] do
        [:oban, :job, event]
      end

    :telemetry.attach_many(
      @telemetry_handler_id,
      events,
      &handle_telemetry_event/4,
      config
    )
  end

  @spec handle_telemetry_event(
          :telemetry.event_name(),
          :telemetry.event_measurements(),
          :telemetry.event_metadata(),
          :telemetry.handler_config()
        ) :: any()
  def handle_telemetry_event(_name, _measurements, _metadata, _config)

  def handle_telemetry_event(
        [:oban, :job, :start],
        %{system_time: system_time} = _measurements,
        %{
          worker: "Skate.AlertsManager.ActiveDetours.S3Exporter",
          args: %{"trigger" => trigger}
        } = _metadata,
        _config
      ) do
    Logger.info(
      "active detour s3 export job: " <>
        "started at #{system_time} " <>
        "because #{trigger}"
    )
  end

  def handle_telemetry_event(
        [:oban, :job, :stop],
        %{duration: duration} = _measurements,
        %{
          worker: "Skate.AlertsManager.ActiveDetours.S3Exporter",
          result: {:ok, count}
        } = _metadata,
        _config
      ) do
    Logger.info(
      "active detour s3 export job: " <>
        "completed in #{duration} ms " <>
        "and exported #{count} detours"
    )
  end

  def handle_telemetry_event(
        [:oban, :job, :exception],
        %{duration: duration} = _measurements,
        %{
          worker: "Skate.AlertsManager.ActiveDetours.S3Exporter",
          reason: reason
        } = _metadata,
        _config
      ) do
    Logger.error(
      "active detour s3 export job: " <>
        "failed in #{duration} ms " <>
        "with reason message '#{reason.message}'"
    )
  end

  def handle_telemetry_event(_, _, _, _), do: nil

  @impl Oban.Worker
  def perform(%Oban.Job{args: args} = _) do
    detours =
      Detour
      |> Ecto.Query.where(status: :active)
      |> Ecto.Query.order_by(desc: :activated_at)
      |> Skate.Repo.all()

    converted =
      detours
      |> Enum.map(fn %Detour{} = detour ->
        try do
          convert!(detour)
        rescue
          _ -> nil
        end
      end)
      |> Enum.reject(&is_nil/1)

    content =
      converted
      |> Enum.map(fn map ->
        try do
          Jason.encode!(map) <> "\n"
        rescue
          _ -> nil
        end
      end)
      |> Enum.reject(&is_nil/1)
      |> Enum.join("")

    with object <- Map.get(args, :object, "detours/active.ndjson"),
         {:ok, bucket} <- Application.fetch_env(:skate, :s3_bucket),
         {:ok, _} <-
           ExAws.request(
             ExAws.S3.put_object(bucket, object, content),
             # pass overrides to allow mocking aws during unit tests
             Application.get_env(:ex_aws, :request_config_overrides, %{})
           ) do
      {:ok, length(converted)}
    else
      # missing required configuration value for s3 bucket
      :error -> {:error, :missing_s3_bucket}
      # aws s3 operation failed
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  Convert a detour into a map.
  """
  @spec convert!(Detour.t()) :: map()
  def convert!(%Detour{} = detour) do
    map =
      %{}
      # add common attributes
      |> Map.merge(%{
        id: detour.id,
        route_id: detour.route_id,
        direction_id: get_in(detour.state, ["context", "routePattern", "directionId"]),
        reason: detour.reason,
        nearest_intersection: detour.nearest_intersection,
        estimated_duration: detour.estimated_duration
      })
      # add timestamp attributes
      |> Map.merge(
        for attribute <- [:activated_at, :updated_at], into: %{} do
          timestamp =
            detour
            |> Map.fetch!(attribute)
            |> DateTime.from_naive!("Etc/UTC")
            |> DateTime.to_unix()

          {attribute, timestamp}
        end
      )

    # add remaining attributes in separate clauses
    convert!(detour, map)
  end

  @doc false
  @spec convert!(Detour.t(), map()) :: map()
  def convert!(detour, map)

  @doc false
  def convert!(%Detour{is_text_only: true} = detour, map) do
    Map.merge(
      map,
      %{
        missed_stops_text_only: get_in(detour.state, ["context", "typedDetour", "missedStops"]),
        connection_points_text_only:
          get_in(detour.state, ["context", "typedDetour", "connectionPoints"])
      }
    )
  end

  @doc false
  def convert!(%Detour{is_text_only: false} = detour, map) do
    Map.merge(
      map,
      %{
        missed_stops:
          case get_in(detour.state, ["context", "finishedDetour", "missedStops"]) do
            missed_stops when is_list(missed_stops) ->
              for %{} = missed_stop <- missed_stops do
                get_in(missed_stop, ["id"])
              end
              |> Enum.reject(&is_nil/1)

            _ ->
              Logger.warning("detour state snapshot has invalid missed stops")

              raise ArgumentError
          end,
        connection_points:
          case get_in(detour.state, ["context", "finishedDetour", "connectionPoint"]) do
            connection_points when is_map(connection_points) ->
              for point <- ["start", "end"] do
                get_in(connection_points, [point, "id"])
              end
              |> Enum.reject(&is_nil/1)

            _ ->
              Logger.warning("detour state snapshot has invalid connection points")

              raise ArgumentError
          end,
        route_segments: %{
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
      }
    )
  end
end
