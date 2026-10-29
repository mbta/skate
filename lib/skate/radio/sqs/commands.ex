defmodule Skate.Radio.SQS.Commands do
  @moduledoc false

  alias Skate.Radio.SQS.Config
  alias Skate.Radio.SQS.Constants

  use GenServer

  @type state :: %{queue_url: String.t()}

  @type command :: %{name: Constants.command_name(), data: any()}

  @spec start_link(GenServer.options()) :: GenServer.on_start()
  def start_link(options \\ [name: __MODULE__]) do
    GenServer.start_link(__MODULE__, nil, options)
  end

  @impl GenServer
  @spec init(nil) :: {:ok, state()} | {:stop, term()}
  def init(nil) do
    case Config.queue_url(:commands) do
      {:ok, queue_url} ->
        {:ok, %{queue_url: queue_url}}

      :error ->
        {:stop, "radio commands queue url is invalid or missing"}
    end
  end

  @impl GenServer
  @spec handle_call({:send, command()}, GenServer.from(), state()) ::
          {:reply, :ok | :error, state()}
  def handle_call(
        {:send, %{name: command_name, data: _} = command},
        _from,
        %{queue_url: queue_url} = state
      ),
      do: {
        :reply,
        with true <- command_name in Constants.command_names(),
             {:ok, serialized} <- Jason.encode(command),
             {:ok, _} <-
               queue_url
               |> ExAws.SQS.send_message(serialized)
               |> ExAws.request(Application.get_env(:ex_aws, :request_config_overrides, %{})) do
          :ok
        else
          _ ->
            :error
        end,
        state
      }
end
