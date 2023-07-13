defmodule SkateWeb.VehiclesSearchChannel do
  use SkateWeb, :channel
  use SkateWeb.AuthenticatedChannel
  require Logger

  alias Realtime.Server
  alias Util.Duration

  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated(
        "vehicles_search:",
        %{"limit" => limit, "text" => text, "property" => property},
        socket
      ) do
    username_from_socket! =
      Application.get_env(
        :skate,
        :username_from_socket!,
        &SkateWeb.AuthManager.username_from_socket!/1
      )

    username = username_from_socket!.(socket)
    %{id: user_id} = Guardian.Phoenix.Socket.current_resource(socket)

    subscribe_args = %{
      property: String.to_existing_atom(property),
      limit: limit,
      text: text
    }

    subscribe_args =
      Map.put(
        subscribe_args,
        :include_logged_out_vehicles,
        Skate.Settings.User.is_in_test_group(user_id, "search-logged-out-vehicles")
      )

    Logger.info(fn ->
      "User=#{username} searched for property=#{subscribe_args.property}, text=#{subscribe_args.text} limit=#{subscribe_args.limit}"
    end)

    vehicles = Duration.log_duration(Server, :subscribe_to_search, [subscribe_args])

    {:ok, %{data: vehicles}, socket}
  end

  @impl Phoenix.Channel
  def handle_in(
        "update_search_query",
        %{"text" => text, "limit" => limit, "property" => property},
        socket
      ) do
    vehicles =
      Duration.log_duration(Server, :update_search_subscription, [
        %{text: text, limit: limit, property: String.to_existing_atom(property)}
      ])

    {:reply, {:ok, %{data: vehicles}}, socket}
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
  defp event_name({_ets, {:search, _}}), do: "search"
end
