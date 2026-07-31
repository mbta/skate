defmodule Skate.AlertsManager.ActiveDetours.S3Exporter do
  @moduledoc """
  Save active detour information for Alerts Manager in AWS S3.
  """

  require Logger

  use Oban.Worker

  require Ecto.Query

  alias Skate.Detours.Db.Detour

  @impl Oban.Worker
  def perform(%Oban.Job{} = job) do
    detours =
      Detour
      |> Ecto.Query.where(status: :active)
      |> Ecto.Query.order_by(desc: :activated_at)
      |> Skate.Repo.all()

    objects =
      detours
      |> Enum.map(fn %Detour{} = detour ->
        # common attributes
        %{
          id: detour.id,
          route_id: detour.route_id,
          direction_id: get_in(detour.state, ["context", "routePattern", "directionId"]),
          reason: detour.reason,
          nearest_intersection: detour.nearest_intersection,
          estimated_duration: detour.estimated_duration
        }
        # timestamp attributes
        |> Map.merge(
          for attribute <- [:activated_at, :updated_at], into: %{} do
            with {:ok, naive_datetime} <- Map.fetch(detour, attribute),
                 {:ok, datetime} <- DateTime.from_naive(naive_datetime, "Etc/UTC"),
                 unix <- DateTime.to_unix(datetime) do
              {attribute, unix}
            else
              # attribute is missing
              :error ->
                {:invalid, true}

              # attribute is invalid
              {:error, _reason} ->
                {:invalid, true}
            end
          end
        )
        # missed stops attribute
        |> Map.merge(
          if detour.is_text_only do
            %{
              missed_stops_text_only:
                get_in(detour.state, ["context", "typedDetour", "missedStops"])
            }
          else
            case get_in(detour.state, ["context", "finishedDetour", "missedStops"]) do
              missed_stops when is_list(missed_stops) ->
                %{
                  missed_stops:
                    missed_stops
                    |> Enum.map(fn %{} = missed_stop -> get_in(missed_stop, ["id"]) end)
                    |> Enum.reject(&is_nil/1)
                }

              _ ->
                %{invalid: true}
            end
          end
        )
        # connection points attribute
        |> Map.merge(
          if detour.is_text_only do
            %{
              connection_points_text_only:
                get_in(detour.state, ["context", "typedDetour", "connectionPoints"])
            }
          else
            case get_in(
                   detour.state,
                   ["context", "finishedDetour", "connectionPoint"]
                 ) do
              connection_points when is_map(connection_points) ->
                %{
                  connection_points:
                    for point <- ["start", "end"] do
                      get_in(connection_points, [point, "id"])
                    end
                    |> Enum.reject(&is_nil/1)
                }

              _ ->
                %{invalid: true}
            end
          end
        )
        # route segments attribute
        |> Map.merge(
          if detour.is_text_only do
            %{}
          else
            %{
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
          end
        )
      end)
      |> Enum.reject(fn %{} = object -> Map.get(object, :invalid, false) end)

    text =
      objects
      |> Enum.map(fn object ->
        with {:ok, json} <- Jason.encode(object) do
          json <> "\n"
        else
          {:error, _} -> nil
        end
      end)
      |> Enum.reject(&is_nil/1)
      |> Enum.join("")

    with object <- Map.get(job.args, :object, "detours/active.ndjson"),
         bucket <- Application.get_env(:skate, :s3_bucket, nil),
         operation when is_binary(bucket) <- ExAws.S3.put_object(bucket, object, text),
         overrides <- Application.get_env(:ex_aws, :request_config_overrides, %{}),
         {:ok, _} <- ExAws.request(operation, overrides) do
      {:ok, length(objects)}
    else
      # aws s3 operation failed
      {:error, %{reason: reason}} ->
        {:error, reason}

      # missing required configuration value
      nil ->
        {:error, "missing required configuration value"}
    end
  end
end
