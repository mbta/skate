defmodule Gtfs do
  use GenServer
  require Logger

  alias Gtfs.Data
  alias Gtfs.HealthServer
  alias Gtfs.Route
  alias Gtfs.Stop
  alias Gtfs.Timepoint

  @type state :: :not_loaded | {:loaded, Data.t()}

  # Queries (Client)

  @spec all_routes(GenServer.server() | nil) :: [Route.t()]
  def all_routes(server \\ nil) do
    server = server || __MODULE__
    GenServer.call(server, :all_routes)
  end

  @spec timepoints_on_route(Route.id(), GenServer.server() | nil) :: [Timepoint.id()]
  def timepoints_on_route(route_id, server \\ nil) do
    server = server || __MODULE__
    GenServer.call(server, {:timepoints_on_route, route_id})
  end

  @spec stops_on_route(Route.id(), GenServer.server() | nil) :: [Stop.id()]
  def stops_on_route(route_id, server \\ nil) do
    server = server || __MODULE__
    GenServer.call(server, {:stops_on_route, route_id})
  end

  # Queries (Server)

  @impl true
  def handle_call(:all_routes, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.all_routes(gtfs_data), state}
  end

  def handle_call({:timepoints_on_route, route_id}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.timepoints_on_route(gtfs_data, route_id), state}
  end

  def handle_call({:stops_on_route, route_id}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.stops_on_route(gtfs_data, route_id), state}
  end

  # Initialization (Client)

  @spec start_link(String.t()) :: GenServer.on_start()
  def start_link(url) do
    GenServer.start_link(
      __MODULE__,
      {{:url, url}, HealthServer.default_server()},
      name: __MODULE__
    )
  end

  @spec start_mocked(Data.mocked_files(), pid() | nil) :: pid()
  def start_mocked(mocked_files, health_server_pid \\ nil) do
    {:ok, pid} =
      GenServer.start_link(__MODULE__, {{:mocked_files, mocked_files}, health_server_pid})

    pid
  end

  # Initialization (Server)

  @impl true
  def init({files_source, health_server_pid}) do
    {:ok, :not_loaded, {:continue, {:load_gtfs, files_source, health_server_pid}}}
  end

  @impl true
  def handle_continue({:load_gtfs, files_source, health_server_pid}, :not_loaded) do
    start_time = Time.utc_now()

    with {:ok, data} <- Data.fetch_gtfs(files_source) do
      state = {:loaded, data}

      Logger.info(fn ->
        "Successfully loaded gtfs, time_in_ms=#{
          Time.diff(Time.utc_now(), start_time, :millisecond)
        }"
      end)

      if health_server_pid do
        HealthServer.loaded(health_server_pid)
      end

      {:noreply, state}
    else
      {:error, error} ->
        Logger.info(fn ->
          "Error loading gtfs, time_in_ms=#{Time.diff(Time.utc_now(), start_time, :millisecond)}"
        end)

        {:stop, error}
    end
  end
end
