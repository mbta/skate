defmodule SkateWeb.VehiclesChannel do
  use SkateWeb, :channel
  require Logger

  alias Realtime.Server
  alias Util.Duration

  @impl Phoenix.Channel
  def join("vehicles:shuttle:all", _message, socket) do
    if SkateWeb.ChannelAuth.valid_token?(socket) do
      shuttles = Duration.log_duration(Server, :subscribe_to_all_shuttles, [])
      {:ok, %{data: shuttles}, socket}
    else
      {:error, "error"}
    end
  end

  def join("vehicles:route:" <> route_id, _message, socket) do
    vehicles_and_ghosts = Duration.log_duration(Server, :subscribe_to_route, [route_id])
    {:ok, %{data: vehicles_and_ghosts}, socket}
  end

  def join("vehicles:run_ids:" <> run_ids, _message, socket) do
    run_ids = String.split(run_ids, ",")
    vehicles_and_ghosts = Duration.log_duration(Server, :subscribe_to_run_ids, [run_ids])
    {:ok, %{data: vehicles_and_ghosts}, socket}
  end

  def join("vehicles:block_ids:" <> block_ids, _message, socket) do
    block_ids = String.split(block_ids, ",")
    vehicles_and_ghosts = Duration.log_duration(Server, :subscribe_to_block_ids, [block_ids])
    {:ok, %{data: vehicles_and_ghosts}, socket}
  end

  def join(
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
          [text, :all]

        "run:" <> text ->
          [text, :run]

        "vehicle:" <> text ->
          [text, :vehicle]

        "operator:" <> text ->
          [text, :operator]
      end

    Logger.info(fn ->
      "User=#{username} searched for property=#{Enum.at(subscribe_args, 1)}, text=#{Enum.at(subscribe_args, 0)}"
    end)

    vehicles = Duration.log_duration(Server, :subscribe_to_search, subscribe_args)

    {:ok, %{data: vehicles}, socket}
  end

  def join(topic, _message, _socket) do
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
