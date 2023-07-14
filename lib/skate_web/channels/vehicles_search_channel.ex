defmodule SkateWeb.VehiclesSearchChannel do
  use SkateWeb, :channel
  use SkateWeb.AuthenticatedChannel
  require Logger

  alias Realtime.Server
  alias Util.Duration

  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated(
        "vehicles_search:" <> subtopic,
        %{"limit" => limit},
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

    subscribe_args = %{
      property: property,
      text: text,
      limit: limit,
      include_logged_out_vehicles:
        Skate.Settings.User.is_in_test_group(user_id, "search-logged-out-vehicles")
    }

    Logger.info(fn ->
      "User=#{username} searched for property=#{subscribe_args.property}, text=#{subscribe_args.text} limit=#{subscribe_args.limit}"
    end)

    result = Duration.log_duration(Server, :subscribe_to_limited_search, [subscribe_args])

    {:ok, %{data: result}, socket}
  end

  @impl Phoenix.Channel
  def handle_in(
        "update_search_query",
        %{"limit" => limit},
        socket
      ) do
    "vehicles_search:" <> subtopic = socket.topic

    %{id: user_id} = Guardian.Phoenix.Socket.current_resource(socket)

    %{property: property, text: text} = search_params_from_subtopic(subtopic)

    result =
      Duration.log_duration(Server, :update_limited_search_subscription, [
        %{
          property: property,
          text: text,
          limit: limit,
          include_logged_out_vehicles:
            Skate.Settings.User.is_in_test_group(user_id, "search-logged-out-vehicles")
        }
      ])

    {:reply, {:ok, %{data: result}}, socket}
  end

  defp search_params_from_subtopic(subtopic) do
    [property, text] = String.split(subtopic, ":", parts: 2)
    %{property: String.to_existing_atom(property), text: text}
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
  defp event_name({_ets, {:limited_search, _}}), do: "limited_search"
end
