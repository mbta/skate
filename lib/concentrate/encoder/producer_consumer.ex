defmodule Concentrate.Encoder.ProducerConsumer do
  @moduledoc """
  GenStage to encode different file types.
  """
  use GenStage
  require Logger
  @start_link_opts [:name]

  def start_link(opts) do
    start_link_opts = Keyword.take(opts, @start_link_opts)
    opts = Keyword.drop(opts, @start_link_opts)
    GenStage.start_link(__MODULE__, opts, start_link_opts)
  end

  @impl GenStage
  def init(opts) do
    {files, opts} = Keyword.pop(opts, :files, [])

    state =
      for {filename, encoder} <- files do
        {filename, &encoder.encode_groups/1}
      end

    {:producer_consumer, state, opts}
  end

  @impl GenStage
  def handle_events(events, _from, state) do
    data = List.last(events)

    responses =
      for {filename, encoder} <- state do
        {time, encoded} = :timer.tc(encoder, [data])

        Logger.debug(fn ->
          "#{__MODULE__} encoded filename=#{inspect(filename)} time=#{time / 1000}"
        end)

        {filename, encoded}
      end

    {:noreply, responses, state, :hibernate}
  end
end
