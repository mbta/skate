defmodule Realtime.DataStatusAlerter do
  @moduledoc false

  use GenServer
  require Logger

  def default_name, do: __MODULE__

  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    name = Keyword.get(opts, :name, default_name())

    subscribe_fn =
      Keyword.get(
        opts,
        :subscribe_fn,
        &Realtime.DataStatusPubSub.subscribe/0
      )

    initial_state = %{subscribe_fn: subscribe_fn}

    GenServer.start_link(__MODULE__, initial_state, name: name)
  end

  @impl GenServer
  def init(%{subscribe_fn: subscribe_fn}) do
    _ = subscribe_fn.()
    {:ok, nil}
  end

  @impl GenServer
  def handle_info({:new_data_status, data_status}, state) do
    if data_status == :outage do
      Logger.warning("Data outage detected data_outage_detected")
    end

    {:noreply, state}
  end
end
