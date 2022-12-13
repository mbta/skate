defmodule SkateWeb.AuthenticatedChannel do
  @moduledoc """
  A `use` macro and `@behaviour` which implements `c:Phoenix.Channel.join/3` and
  calls `c:SkateWeb.AuthenticatedChannel.join_authenticated/3` when socket is
  authenticated.

  This ensures that the token associated with the `socket` passed to
  `c:Phoenix.Channel.join/3` is valid before forwarding the call to
  `c:SkateWeb.AuthenticatedChannel.join_authenticated/3`.

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
  Macro which imports the `SkateWeb.AuthenticatedChannel` behaviour and
  implements `c:Phoenix.Channel.join/3` for
  `c:SkateWeb.AuthenticatedChannel.join_authenticated/3`
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
    end
  end
end
