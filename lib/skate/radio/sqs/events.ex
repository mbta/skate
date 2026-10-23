defmodule Skate.Radio.SQS.Events do
  @moduledoc false

  use Broadway

  alias Broadway.Message

  alias Skate.Radio.SQS.Config

  require Logger

  @spec start_link(GenServer.options()) :: GenServer.on_start()
  def start_link(_options \\ []) do
    case Config.queue_url(:events) do
      {:ok, queue_url} ->
        Broadway.start_link(__MODULE__,
          name: __MODULE__,
          producer: [
            module: {BroadwaySQS.Producer, queue_url: queue_url}
          ],
          processors: [
            default: []
          ],
          batchers: [
            default: [
              batch_size: 10,
              batch_timeout: 2000
            ]
          ]
        )

      :error ->
        {:error, "radio events queue url is invalid or missing"}
    end
  end

  @impl Broadway
  @spec handle_message(atom(), Message.t(), term()) :: Message.t()
  def handle_message(_processor, message, _context), do: message

  @impl Broadway
  @spec handle_batch(atom(), [Message.t()], Broadway.BatchInfo.t(), term()) :: [Message.t()]
  def handle_batch(_batcher, messages, _batch_info, _context) do
    Enum.map(
      messages,
      fn %Message{data: event} = message ->
        Logger.info("received radio event: #{inspect(event)}")
        message
      end
    )
  end
end
