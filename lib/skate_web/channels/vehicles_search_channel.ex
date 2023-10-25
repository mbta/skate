defmodule SkateWeb.VehiclesSearchChannel do
  use SkateWeb, :channel
  use SkateWeb.AuthenticatedChannel
  require Logger

  alias Realtime.Server
  alias Util.Duration

  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated(
        "vehicles_search:limited:" <> subtopic,
        _params,
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

    %{property: property, text: text} = search_params_from_subtopic(subtopic)

    limit =
      Application.get_env(
        :skate,
        :vehicle_search_default_limit,
        25
      )

    subscribe_args = %{
      property: property,
      text: text,
      limit: limit,
      include_logged_out_vehicles: Skate.Settings.User.is_in_test_group(user_id, "map-beta")
    }

    Logger.info(fn ->
      "#{__MODULE__} limited_search User=#{username} searched for property=#{subscribe_args.property}, text=#{subscribe_args.text}"
    end)

    {lookup_key, result} =
      Duration.log_duration(Server, :subscribe_to_limited_search, [subscribe_args])

    {:ok, %{data: result},
     Phoenix.Socket.assign(socket, Map.merge(socket.assigns, %{lookup_key: lookup_key}))}
  end

  @impl SkateWeb.AuthenticatedChannel
  def handle_in_authenticated(
        "update_search_query",
        %{"limit" => limit},
        socket
      ) do
    "vehicles_search:limited:" <> subtopic = socket.topic

    username_from_socket! =
      Application.get_env(
        :skate,
        :username_from_socket!,
        &SkateWeb.AuthManager.username_from_socket!/1
      )

    %{id: user_id} = Guardian.Phoenix.Socket.current_resource(socket)
    username = username_from_socket!.(socket)

    %{property: property, text: text} = search_params_from_subtopic(subtopic)

    {lookup_key, result} =
      Duration.log_duration(Server, :update_limited_search_subscription, [
        %{
          property: property,
          text: text,
          limit: limit,
          include_logged_out_vehicles: Skate.Settings.User.is_in_test_group(user_id, "map-beta")
        }
      ])

    Logger.info(fn ->
      "#{__MODULE__} limited_search User=#{username} updated limit for property=#{property}limit=#{limit}"
    end)

    {:reply, {:ok, %{data: result}},
     Phoenix.Socket.assign(socket, Map.merge(socket.assigns, %{lookup_key: lookup_key}))}
  end

  defp search_params_from_subtopic(subtopic) do
    [property, text] = String.split(subtopic, ":", parts: 2)
    %{property: String.to_existing_atom(property), text: text}
  end

  @impl SkateWeb.AuthenticatedChannel
  def handle_info_authenticated({:new_realtime_data, ets}, socket) do
    lookup_key = socket.assigns[:lookup_key]

    event_name = event_name(lookup_key)
    data = Server.lookup({ets, lookup_key})

    :ok = push(socket, event_name, %{data: data})
    {:noreply, socket}
  end

  @spec event_name(Server.subscription_key()) :: String.t()
  defp event_name({:limited_search, _}), do: "limited_search"
end
