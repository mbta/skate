defmodule SkateWeb.VehiclesChannel do
  use SkateWeb, :channel
  use SkateWeb.AuthenticatedChannel
  require Logger

  alias Realtime.Server
  alias Util.Duration

  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("vehicles:shuttle:all", _message, socket) do
    shuttles = Duration.log_duration(Server, :subscribe_to_all_shuttles, [])
    {:ok, %{data: shuttles}, socket}
  end

  def join_authenticated("vehicles:route:" <> route_id, _message, socket) do
    vehicles_and_ghosts = Duration.log_duration(Server, :subscribe_to_route, [route_id])
    {:ok, %{data: vehicles_and_ghosts}, socket}
  end

  def join_authenticated("vehicles:run_ids:" <> run_ids, _message, socket) do
    run_ids = String.split(run_ids, ",")
    vehicles_and_ghosts = Duration.log_duration(Server, :subscribe_to_run_ids, [run_ids])
    {:ok, %{data: vehicles_and_ghosts}, socket}
  end

  def join_authenticated("vehicles:block_ids:" <> block_ids, _message, socket) do
    block_ids = String.split(block_ids, ",")
    vehicles_and_ghosts = Duration.log_duration(Server, :subscribe_to_block_ids, [block_ids])
    {:ok, %{data: vehicles_and_ghosts}, socket}
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
        :include_unassigned_vehicles,
        Skate.Settings.User.is_in_test_group(user_id, "search-logged-out-vehicles")
      )

    Logger.info(fn ->
      "User=#{username} searched for property=#{subscribe_args.property}, text=#{subscribe_args.text}"
    end)

    vehicles = Duration.log_duration(Server, :subscribe_to_search, [subscribe_args])

    {:ok, %{data: vehicles}, socket}
  end

  def join_authenticated(topic, _message, _socket) do
    {:error, %{message: "no such topic \"#{topic}\""}}
  end

  @impl Phoenix.Channel
  def handle_info({:new_realtime_data, lookup_args}, socket) do
    if SkateWeb.ChannelAuth.valid_token?(socket) do
      event_name = event_name(lookup_args)
      data = Server.lookup(lookup_args)
      :ok = push(socket, event_name, %{data: data})
      {:noreply, socket}
    else
      :ok = push(socket, "auth_expired", %{})
      {:stop, :normal, socket}
    end
  end

  @spec event_name(Server.lookup_key()) :: String.t()
  defp event_name({_ets, :all_shuttles}), do: "shuttles"
  defp event_name({_ets, {:search, _}}), do: "search"
  defp event_name({_ets, _}), do: "vehicles"
end
