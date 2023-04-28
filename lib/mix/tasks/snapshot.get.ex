defmodule Mix.Tasks.Snapshot.Get do
  @moduledoc """
  Download the data sources we use into a folder to use as a snapshot in time
  """

  require Logger
  use Mix.Task
  # @requirements [:tzdata]'

  @impl Mix.Task
  def run(_) do
    # config :logger,
    Logger.configure_backend(
      :console,
      format: "$time [$level] $message $metadata\n",
      metadata: :all
    )

    {:ok, _started} = Application.ensure_all_started(:httpoison)
    {:ok, _started} = Application.ensure_all_started(:timex)

    time = Timex.set(Timex.local, microsecond: 0)
    dirname = "snapshots/#{Timex.format!(time, "{ISO:Extended}")}"

    File.mkdir_p!(dirname)
    File.cd!(dirname)


    Task.await_many([
      async_download_to(fn -> HTTPoison.get!(System.get_env("GTFS_URL")) end, "GTFS.zip"),
      async_download_to(fn -> HTTPoison.get!(System.get_env("BUSLOC_URL")) end, "VehiclePositions_enhanced.json"),
      async_download_to(fn -> HTTPoison.get!(System.get_env("TRIP_UPDATES_URL")) end, "TripUpdates_enhanced.json"),
      async_download_to(fn -> HTTPoison.get!(System.get_env("SKATE_HASTUS_URL")) end, "HASTUS.zip"),
      async_download_to(fn -> HTTPoison.get!(
        System.get_env("SWIFTLY_REALTIME_VEHICLES_URL"),
        [{"Authorization", System.get_env("SWIFTLY_AUTHORIZATION_KEY")}],
        params: %{
          unassigned: "true",
          verbose: "true"
        }
      ) end, "Swiftly.Vehicles.json")
    ])
  end

  defp async_download_to(download_fn, filename) do
    Logger.info("downloading file", filename: filename)
    Task.async(fn -> download_file_to(download_fn, filename) end)
  end

  defp download_file_to(request_fn, file) do
    %{ body: body, status_code: 200 } = request_fn.()
    Logger.info("downloaded file", filename: file)

    File.write!(file, body)
  end
end
