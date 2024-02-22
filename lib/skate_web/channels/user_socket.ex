defmodule SkateWeb.UserSocket do
  require Logger
  use Phoenix.Socket

  ## Channels
  channel("data_status", SkateWeb.DataStatusChannel)
  channel("vehicle:*", SkateWeb.VehicleChannel)
  channel("vehicles:*", SkateWeb.VehiclesChannel)
  channel("vehicles_search:*", SkateWeb.VehiclesSearchChannel)
  channel("train_vehicles:*", SkateWeb.TrainVehiclesChannel)
  channel("notifications", SkateWeb.NotificationsChannel)
  channel("alerts:*", SkateWeb.AlertsChannel)

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
  def connect(%{"token" => token}, socket, _connect_info) do
    user_id =
      with %{claims: claims} <- Guardian.peek(SkateWeb.AuthManager, token),
           {:ok, %{id: id}} <- SkateWeb.AuthManager.resource_from_claims(claims) do
        id
      else
        _ -> nil
      end

    case Guardian.Phoenix.Socket.authenticate(socket, SkateWeb.AuthManager, token) do
      {:ok, authed_socket} ->
        Logger.info("#{__MODULE__} socket_authenticated user_id=#{user_id}")

        {:ok, authed_socket}

      {:error, _reason} ->
        if !is_nil(user_id) do
          Logger.info("#{__MODULE__} socket_auth_rejected user_id=#{user_id}")
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
  def id(_socket), do: nil
end
