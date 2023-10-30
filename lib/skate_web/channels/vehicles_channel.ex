defmodule SkateWeb.VehiclesChannel do
  use SkateWeb, :channel
  use SkateWeb.AuthenticatedChannel
  require Logger

  alias Realtime.Server
  alias Util.Duration

  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("vehicles:shuttle:all", _message, socket) do
    {lookup_key, shuttles} = Duration.log_duration(Server, :subscribe_to_all_shuttles, [])

    {:ok, %{data: shuttles}, Phoenix.Socket.assign(socket, lookup_key: lookup_key)}
  end

  def join_authenticated("vehicles:pull_backs:all", _message, socket) do
    {lookup_key, pull_backs} = Duration.log_duration(Server, :subscribe_to_all_pull_backs, [])

    {:ok, %{data: pull_backs}, Phoenix.Socket.assign(socket, lookup_key: lookup_key)}
  end

  def join_authenticated("vehicles:route:" <> route_id, _message, socket) do
    {lookup_key, vehicles_and_ghosts} =
      Duration.log_duration(Server, :subscribe_to_route, [route_id])

    {:ok, %{data: vehicles_and_ghosts}, Phoenix.Socket.assign(socket, lookup_key: lookup_key)}
  end

  def join_authenticated("vehicles:run_ids:" <> run_ids, _message, socket) do
    run_ids = String.split(run_ids, ",")

    {lookup_key, vehicles_and_ghosts} =
      Duration.log_duration(Server, :subscribe_to_run_ids, [run_ids])

    {:ok, %{data: vehicles_and_ghosts}, Phoenix.Socket.assign(socket, lookup_key: lookup_key)}
  end

  def join_authenticated("vehicles:block_ids:" <> block_ids, _message, socket) do
    block_ids = String.split(block_ids, ",")

    {lookup_key, vehicles_and_ghosts} =
      Duration.log_duration(Server, :subscribe_to_block_ids, [block_ids])

    {:ok, %{data: vehicles_and_ghosts}, Phoenix.Socket.assign(socket, lookup_key: lookup_key)}
  end

  def join_authenticated(
        "vehicles:search:" <> search_params,
        _message,
        socket
      ) do
    username_from_socket! =
      Application.get_env(
        :skate,
        :username_from_socket!,
        &SkateWeb.AuthManager.username_from_socket!/1
      )

    username = username_from_socket!.(socket)

    subscribe_args =
      case search_params do
        "all:" <> text ->
          %{text: text, property: :all}

        "run:" <> text ->
          %{text: text, property: :run}

        "vehicle:" <> text ->
          %{text: text, property: :vehicle}

        "operator:" <> text ->
          %{text: text, property: :operator}
      end

    %{id: user_id} = Guardian.Phoenix.Socket.current_resource(socket)

    subscribe_args =
      Map.put(
        subscribe_args,
        :include_logged_out_vehicles,
        Skate.Settings.User.is_in_test_group(user_id, "map-beta")
      )

    Logger.info(fn ->
      "User=#{username} searched for property=#{subscribe_args.property}, text=#{subscribe_args.text}"
    end)

    {lookup_key, vehicles} = Duration.log_duration(Server, :subscribe_to_search, [subscribe_args])

    {:ok, %{data: vehicles}, Phoenix.Socket.assign(socket, lookup_key: lookup_key)}
  end

  def join_authenticated(topic, _message, _socket) do
    {:error, %{message: "no such topic \"#{topic}\""}}
  end

  @impl SkateWeb.AuthenticatedChannel
  def handle_info_authenticated({:new_realtime_data, ets}, socket) do
    lookup_key = socket.assigns[:lookup_key]

    data = Server.lookup({ets, lookup_key})

    event_name = event_name(lookup_key)
    :ok = push(socket, event_name, %{data: data})

    {:noreply, socket}
  end

  @spec event_name(Server.subscription_key()) :: String.t()
  defp event_name(:all_shuttles), do: "shuttles"
  defp event_name(:all_pull_backs), do: "pull_backs"
  defp event_name({:search, _}), do: "search"
  defp event_name(_), do: "vehicles"
end
