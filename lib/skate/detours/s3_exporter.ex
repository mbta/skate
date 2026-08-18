defmodule Skate.Detours.S3Exporter do
  @moduledoc """
  Export detour information to S3.
  """

  require Logger

  use Oban.Worker, max_attempts: 3

  require Ecto.Query

  alias Skate.Detours.Db.Detour
  alias Skate.Detours.Detour.Report

  @impl Oban.Worker
  def perform(%Oban.Job{args: args} = _) do
    with {:ok, %{"status" => status} = filter} <- Map.fetch(args, "filter"),
         {:ok, bucket} when is_binary(bucket) <- Map.fetch(args, "bucket") do
      # Hack b/c Oban serializes everything to strings, but Ecto stores enums as atoms
      if status in Enum.map(Ecto.Enum.values(Detour, :status), &to_string/1) do
        export(filter, bucket)
      else
        {:error, :invalid_job_arg_filter_value_detour_status}
      end
    else
      _ ->
        {:error, :invalid_job_args}
    end
  end

  def perform(%Oban.Job{} = _job) do
    {:error, :missing_job_args}
  end

  @spec export(map(), binary(), keyword()) :: {:ok, integer()} | {:error, any()}
  def export(%{"status" => status} = _, bucket, order_by \\ [desc: :updated_at]) do
    selected =
      Detour
      |> Ecto.Query.where(status: ^status)
      |> Ecto.Query.order_by(^order_by)
      |> Detour.Queries.with_virtual_fields()
      |> Skate.Repo.all()

    converted =
      selected
      |> Enum.map(fn %Detour{} = detour ->
        try do
          Report.from!(detour)
        rescue
          _ -> nil
        end
      end)
      |> Enum.reject(&is_nil/1)

    serialized =
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

    case ExAws.request(
           ExAws.S3.put_object(bucket, "detours/#{status}.ndjson", serialized),
           # pass overrides to allow mocking aws during unit tests
           Application.get_env(:ex_aws, :request_config_overrides, %{})
         ) do
      {:ok, _} -> {:ok, length(converted)}
      {:error, reason} -> {:error, reason}
    end
  end

  defmodule Telemetry do
    @moduledoc """
    Provides methods for configuring telemetry.
    """

    @default_handler_id "skate.detours.s3_exporter"
    @default_handler_config []

    @doc """
    Attach a handler that subscribes to the Oban job start, stop, and exception events.
    """
    def attach_handler(id \\ @default_handler_id, config \\ @default_handler_config) do
      # https://oban.hexdocs.pm/Oban.Telemetry.html#module-job-events
      events =
        for event <- [:start, :stop, :exception] do
          [:oban, :job, event]
        end

      :telemetry.attach_many(id, events, &handle_event/4, config)
    end

    @doc false
    @spec handle_event(
            :telemetry.event_name(),
            :telemetry.event_measurements(),
            :telemetry.event_metadata(),
            :telemetry.handler_config()
          ) :: any()
    def handle_event(_name, _measurements, _metadata, _config)

    def handle_event(
          [:oban, :job, :start],
          %{system_time: system_time} = _measurements,
          %{
            worker: "Skate.Detours.S3Exporter",
            args: %{
              "filter" => filter,
              "reason" => reason
            }
          } = _metadata,
          _config
        ) do
      Logger.info(
        "detour s3 export job: " <>
          "started at #{system_time} " <>
          "because #{reason} " <>
          "with filter #{inspect(filter)}"
      )
    end

    def handle_event(
          [:oban, :job, :stop],
          %{duration: duration} = _measurements,
          %{
            worker: "Skate.Detours.S3Exporter",
            args: %{"filter" => filter},
            result: {:ok, count}
          } = _metadata,
          _config
        ) do
      Logger.info(
        "detour s3 export job: " <>
          "completed in #{duration} ms " <>
          "and exported #{count} detours " <>
          "with filter #{inspect(filter)}"
      )
    end

    def handle_event(
          [:oban, :job, :exception],
          %{duration: duration} = _measurements,
          %{
            worker: "Skate.Detours.S3Exporter",
            reason: reason
          } = _metadata,
          _config
        ) do
      Logger.error(
        "detour s3 export job: " <>
          "failed in #{duration} ms " <>
          "with reason message '#{reason.message}'"
      )
    end

    def handle_event(_, _, _, _), do: nil
  end
end
