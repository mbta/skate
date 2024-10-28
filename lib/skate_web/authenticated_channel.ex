defmodule SkateWeb.AuthenticatedChannel do
  @moduledoc """
  A `use` macro and `@behaviour` which implements `c:Phoenix.Channel.join/3` and
  calls `c:SkateWeb.AuthenticatedChannel.join_authenticated/3` when socket is
  authenticated.

  This ensures that the token associated with the `socket` passed to
  `c:Phoenix.Channel.join/3` is valid before forwarding the call to
  `c:SkateWeb.AuthenticatedChannel.join_authenticated/3`.

  In addition, implements `c:Phoenix.Channel.handle_info/2` and
  calls `c:SkateWeb.AuthenticatedChannel.handle_info/2` with the provided message
  after checking the socket's current validity, as well as a similar
  `c:SkateWeb.AuthenticatedChannel.handle_in/3` callback.

  ## Examples
  Simple usage of `SkateWeb.AuthenticatedChannel`
  ```
  defmodule MyChannel do
    use SkateWeb.AuthenticatedChannel

    @impl SkateWeb.AuthenticatedChannel
    def join_authenticated("room:lobby", payload, socket) do
      # The token associated with this socket is valid within this function
      {:ok, %{data: "payload"}, socket}
    end
  end
  ```

  ## Implementation Details
  `use`ing `SkateWeb.AuthenticatedChannel` will implement the
  `c:Phoenix.Channel.join/3` callback to return
  ```
  {:error, %{reason: :not_authenticated}}
  ```
  when the `socket` is not valid per `SkateWeb.ChannelAuth.valid_token?`.
  """
  @moduledoc since: "https://github.com/mbta/skate/pull/1835"

  @doc """
  Handle __authenticated__ socket channel joins by topic.

  see: `c:Phoenix.Channel.join/3` for relevant docs.
  """
  @callback join_authenticated(
              topic :: binary,
              payload :: Phoenix.Channel.payload(),
              socket :: Phoenix.Socket.t()
            ) ::
              {:ok, Phoenix.Socket.t()}
              | {:ok, reply :: Phoenix.Channel.payload(), Phoenix.Socket.t()}
              | {:error, reason :: map()}

  @doc """
  Handles a process message once the current validity of the token has been
  checked.

  see: `c:Phoenix.Channel.handle_info/2` for relevant docs.
  """
  @callback handle_info_authenticated(msg :: term, socket :: Phoenix.Socket.t()) ::
              {:noreply, Phoenix.Socket.t()}
              | {:stop, reason :: term, Phoenix.Socket.t()}

  @doc """
  Handles an incoming message once the current validity of the token has been
  checked.

  see: `c:Phoenix.Channel.handle_in/3` for relevant docs.
  """
  @callback handle_in_authenticated(
              event :: String.t(),
              payload :: Phoenix.Channel.payload(),
              socket :: Phoenix.Socket.t()
            ) ::
              {:noreply, Phoenix.Socket.t()}
              | {:noreply, Phoenix.Socket.t(), timeout | :hibernate}
              | {:reply, Phoenix.Channel.reply(), Phoenix.Socket.t()}
              | {:stop, reason :: term, Phoenix.Socket.t()}
              | {:stop, reason :: term, Phoenix.Channel.reply(), Phoenix.Socket.t()}

  @optional_callbacks [handle_info_authenticated: 2, handle_in_authenticated: 3]

  @doc """
  Macro which imports the `SkateWeb.AuthenticatedChannel` behaviour. Implements
  `c:Phoenix.Channel.join/3` for `c:SkateWeb.AuthenticatedChannel.join_authenticated/3`
  as well as `c:Phoenix.Channel.handle_info/2` for
  `c:SkateWeb.AuthenticatedChannel.handle_info_authenticated/2` and `c:Phoenix.Channel.handle_in/3`
  for `c:SkateWeb.AuthenticatedChannel.handle_in_authenticated/3`
  """
  defmacro __using__(_) do
    quote do
      @behaviour SkateWeb.AuthenticatedChannel

      @impl Phoenix.Channel
      def join(topic, payload, socket) do
        if SkateWeb.ChannelAuth.valid_token?(socket) do
          join_authenticated(topic, payload, socket)
        else
          {:error, %{reason: :not_authenticated}}
        end
      end

      @impl Phoenix.Channel
      def handle_info(message, socket) do
        if SkateWeb.ChannelAuth.valid_token?(socket) do
          handle_info_authenticated(message, socket)
        else
          :ok = push(socket, "auth_expired", %{})
          {:stop, :normal, socket}
        end
      end

      @impl SkateWeb.AuthenticatedChannel
      def handle_info_authenticated(_message, socket), do: {:noreply, socket}
      defoverridable handle_info_authenticated: 2

      @impl Phoenix.Channel
      def handle_in(event, payload, socket) do
        if SkateWeb.ChannelAuth.valid_token?(socket) do
          handle_in_authenticated(event, payload, socket)
        else
          :ok = push(socket, "auth_expired", %{})
          {:stop, :normal, socket}
        end
      end

      @impl SkateWeb.AuthenticatedChannel
      def handle_in_authenticated(_event, _payload, socket), do: {:noreply, socket}
      defoverridable handle_in_authenticated: 3
    end
  end
end
