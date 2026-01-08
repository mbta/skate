defmodule Concentrate.Producer.Mqtt do
  @moduledoc """
  GenStage Producer which fulfills demand by receiving events from an MQTT broker.
  """
  use GenStage
  require Logger
  alias EmqttFailover.Connection
  @start_link_opts [:name]

  defmodule State do
    @moduledoc false
    defstruct [:parser]
  end

  alias __MODULE__.State

  def start_link(opts) when is_list(opts) do
    start_link_opts = Keyword.take(opts, @start_link_opts)
    opts = Keyword.drop(opts, @start_link_opts)
    GenStage.start_link(__MODULE__, opts, start_link_opts)
  end

  @impl GenStage
  def init(opts) do
    parser =
      case Keyword.fetch!(opts, :parser) do
        module when is_atom(module) ->
          &module.parse/1

        fun when is_function(fun, 1) ->
          fun
      end

    start_opts = emqtt_opts(opts)
    {:ok, _client} = Connection.start_link(start_opts)

    {
      :producer,
      %State{parser: parser},
      dispatcher: GenStage.BroadcastDispatcher
    }
  end

  @impl GenStage
  def handle_demand(_demand, state) do
    # we don't care, buffering takes care of any demand management
    {:noreply, [], state}
  end

  @impl GenStage
  def handle_info({:message, _pid, msg}, state) do
    parsed =
      state.parser.(decode_payload(msg.payload))

    {:noreply, [parsed], state}
  end

  def handle_info({:connected, _pid}, state) do
    Logger.info("MQTT producer connected to broker")
    {:noreply, [], state}
  end

  def handle_info({:disconnected, _pid, reason}, state) do
    Logger.warning("MQTT producer disconnected from broker: #{inspect(reason)}")
    {:noreply, [], state}
  end

  defp emqtt_opts(opts) do
    configs = Keyword.fetch!(opts, :broker_configs)
    topics = opts[:topics] || []

    [
      configs: configs,
      client_id_prefix: "skate-prd",
      handler: {EmqttFailover.ConnectionHandler.Parent, parent: self(), topics: topics},
      backoff: Keyword.get(opts, :backoff)
    ]
  end

  defp decode_payload(<<0x1F, 0x8B, _::binary>> = payload) do
    # gzip encoded
    :zlib.gunzip(payload)
  end

  defp decode_payload(payload) when is_binary(payload) do
    payload
  end
end
