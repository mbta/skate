defmodule SkateWeb.UserSocket do
  require Logger

  use Phoenix.Socket,
    max_channels_per_transport: 500

  ## Channels
  channel("data_status", SkateWeb.DataStatusChannel)
  channel("vehicle:*", SkateWeb.VehicleChannel)
  channel("vehicles:*", SkateWeb.VehiclesChannel)
  channel("vehicles_search:*", SkateWeb.VehiclesSearchChannel)
  channel("train_vehicles:*", SkateWeb.TrainVehiclesChannel)
  channel("notifications", SkateWeb.NotificationsChannel)
  channel("alerts:*", SkateWeb.AlertsChannel)
  channel("detours:*", SkateWeb.DetoursChannel)
  channel("research:scenarios:*", SkateWeb.ResearchScenarioChannel)

  # Socket params are passed from the client and can
  # be used to verify and authenticate a user. After
  # verification, you can put default assigns into
  # the socket that will be set for all channels, ie
  #
  #     {:ok, assign(socket, :user_id, verified_user_id)}
  #
  # To deny connection, return `:error`.
  #
  # See `Phoenix.Token` documentation for examples in
  # performing token verification on connect.
  @impl Phoenix.Socket
  def connect(%{"token" => token}, socket, _connect_info) do
    unverified_user_id =
      with %{claims: claims} <- SkateWeb.AuthManager.peek(token),
           {:ok, %{id: id}} <- SkateWeb.AuthManager.resource_from_claims(claims) do
        id
      else
        _ -> nil
      end

    case Guardian.Phoenix.Socket.authenticate(socket, SkateWeb.AuthManager, token) do
      {:ok, authed_socket} ->
        Logger.info("socket_authenticated user_id=#{unverified_user_id}")

        {:ok, authed_socket}

      {:error, _reason} ->
        if !is_nil(unverified_user_id) do
          Logger.info("socket_auth_rejected user_id=#{unverified_user_id}")
        end

        :error
    end
  end

  # Socket id's are topics that allow you to identify all sockets for a given user:
  #
  #     def id(socket), do: "user_socket:#{socket.assigns.user_id}"
  #
  # Would allow you to broadcast a "disconnect" event and terminate
  # all active sockets and channels for a given user:
  #
  #     SkateWeb.Endpoint.broadcast("user_socket:#{user.id}", "disconnect", %{})
  #
  # Returning `nil` makes this socket anonymous.
  @impl Phoenix.Socket
  def id(_socket), do: nil

  ### Override the transport callback implementations to monitor the socket lifecycle.
  defoverridable init: 1, terminate: 2

  alias SkateWeb.SocketMonitor

  @impl Phoenix.Socket.Transport
  @spec init(Phoenix.Socket.Transport.state()) ::
          {:ok, Phoenix.Socket.Transport.state()}
  def init(state) do
    {:ok, {_, %Phoenix.Socket{} = socket} = state} = super(state)
    SocketMonitor.monitor(socket)
    {:ok, state}
  end

  @impl Phoenix.Socket.Transport
  @spec terminate(term(), Phoenix.Socket.Transport.state()) :: :ok
  def terminate(reason, state) do
    case state do
      {_, %Phoenix.Socket{} = socket} -> SocketMonitor.demonitor(socket, reason)
      _ -> :ok
    end

    super(reason, state)
  end
end
