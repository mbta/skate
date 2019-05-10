defmodule Concentrate.Producer.HTTP do
  @moduledoc """
  GenStage Producer which fulfills demand by fetching from an HTTP Server.
  """
  use GenStage
  alias Concentrate.Producer.HTTP.StateMachine, as: SM
  require Logger
  @start_link_opts [:name]

  defmodule State do
    @moduledoc """
    Module for keeping track of the state for an HTTP producer.
    """
    defstruct [:machine, demand: 0]
  end

  alias __MODULE__.State

  def start_link({url, opts}) when is_binary(url) and is_list(opts) do
    start_link_opts = Keyword.take(opts, @start_link_opts)
    opts = Keyword.drop(opts, @start_link_opts)
    GenStage.start_link(__MODULE__, {url, opts}, start_link_opts)
  end

  @impl GenStage
  def init({url, opts}) do
    parser =
      case Keyword.fetch!(opts, :parser) do
        module when is_atom(module) ->
          &module.parse(&1, [])

        {module, opts} when is_atom(module) and is_list(opts) ->
          &module.parse(&1, opts)

        fun when is_function(fun, 1) ->
          fun
      end

    opts = Keyword.put(opts, :parser, parser)
    machine = SM.init(url, opts)

    {
      :producer,
      %State{machine: machine},
      dispatcher: GenStage.BroadcastDispatcher
    }
  end

  @impl GenStage
  def handle_info(message, %{machine: machine, demand: demand} = state) do
    {machine, events, outgoing_messages} = SM.message(machine, message)
    events = Enum.take(events, demand)
    new_demand = demand - length(events)

    if new_demand > 0 do
      send_outgoing_messages(outgoing_messages)
    end

    new_state = %{state | machine: machine, demand: new_demand}

    if events == [] do
      {:noreply, events, new_state}
    else
      {:noreply, events, new_state, :hibernate}
    end
  end

  @impl GenStage
  def handle_demand(new_demand, %{machine: machine, demand: existing_demand} = state) do
    if existing_demand == 0 do
      {^machine, [], outgoing_messages} = SM.fetch(machine)

      send_outgoing_messages(outgoing_messages)
    end

    {:noreply, [], %{state | machine: machine, demand: new_demand + existing_demand}}
  end

  defp send_outgoing_messages(outgoing_messages) do
    for {message, send_after} <- outgoing_messages do
      Process.send_after(self(), message, send_after)
    end
  end
end
