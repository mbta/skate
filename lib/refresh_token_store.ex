defmodule RefreshTokenStore do
  use GenServer

  alias RefreshTokenStore.Store

  # Client

  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, nil, name: Keyword.get(opts, :name, __MODULE__))
  end

  @spec put_refresh_token(Store.username(), Store.token()) :: :ok
  @spec put_refresh_token(Store.username(), Store.token(), GenServer.server()) :: :ok
  def put_refresh_token(username, token, server \\ __MODULE__) do
    GenServer.call(server, {:put_refresh_token, username, token})
  end

  @spec get_refresh_token(Store.username()) :: Store.token()
  @spec get_refresh_token(Store.username(), GenServer.server()) :: Store.token()
  def get_refresh_token(username, server \\ __MODULE__) do
    GenServer.call(server, {:get_refresh_token, username})
  end

  @spec clear_refresh_token(Store.username()) :: :ok
  @spec clear_refresh_token(Store.username(), GenServer.server()) :: :ok
  def clear_refresh_token(username, server \\ __MODULE__) do
    GenServer.call(server, {:clear_refresh_token, username})
  end

  # Server

  @impl GenServer
  def init(_) do
    {:ok, %Store{}}
  end

  @impl GenServer
  def handle_call(
        {:put_refresh_token, username, token},
        _from,
        state
      ) do
    new_state = Store.put_refresh_token(state, username, token)
    {:reply, :ok, new_state}
  end

  @impl GenServer
  def handle_call({:get_refresh_token, username}, _from, state) do
    token = Store.get_refresh_token(state, username)
    {:reply, token, state}
  end

  @impl GenServer
  def handle_call({:clear_refresh_token, username}, _from, state) do
    new_state = Store.clear_refresh_token(state, username)
    {:reply, :ok, new_state}
  end
end
