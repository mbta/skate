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
end
