defmodule SkateWeb.AuthenticatedChannel do
  @doc """

  """
  @callback join_authenticated(any, any, Phoenix.Socket.t()) ::
              {:error, :not_authenticated | %{message: <<_::64, _::_*8>>}}
              | {:ok, %{data: any}, any}

  defmacro __using__(_) do
    quote do
      @behaviour SkateWeb.AuthenticatedChannel

      @impl Phoenix.Channel

      def join(topic, message, socket) do
        if SkateWeb.ChannelAuth.valid_token?(socket) do
          join_authenticated(topic, message, socket)
        else
          {:error, :not_authenticated}
        end
      end
    end
  end
end
