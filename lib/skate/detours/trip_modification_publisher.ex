defmodule Skate.Detours.TripModificationPublisher do
  @moduledoc """
  Connects to the MQTT Broker, then allows sending `Realtime.TripModification`'s
  to the Broker.

  References: https://github.com/mbta/ride_along/blob/fb440fb15dce22921fc4a141a125f3645da98b26/lib/ride_along/sql_publisher.ex
  """
  use GenServer

  @default_name __MODULE__
  def start_link(opts) do
    if opts[:start] do
      name = Keyword.get(opts, :name, @default_name)
      GenServer.start_link(__MODULE__, opts, name: name)
    else
      :ignore
    end
  end

  @doc """
  Publishes a `Realtime.TripModification` to the configured `MQTT` server.

  MQTT is optional for Skate, and callers should remember to handle both the
  `:ok` and `:error` return values
  """
  def publish_modification(
        %Realtime.TripModification{} = modification,
        opts \\ []
      ) do
    is_draft? = Keyword.get(opts, :is_draft?, false)
    server = Keyword.get(opts, :server, @default_name)

    GenServer.call(
      server,
      {
        :new_modification,
        %{
          is_draft?: is_draft?,
          modification: modification
        }
      }
    )
  end

  @type t :: %{
          connection: Skate.MqttConnection.on_start() | nil,
          on_connect_subscribers: [pid()]
        }
  defstruct connection: nil, on_connect_subscribers: []

  @impl GenServer
  def init(opts) do
    state = %__MODULE__{
      on_connect_subscribers: Keyword.get_values(opts, :on_connect)
    }

    {:ok, state, {:continue, :connect}}
  end

  @impl GenServer
  def handle_continue(:connect, state) do
    {:ok, connection} = Skate.MqttConnection.start_link()

    {:noreply,
     %{
       state
       | connection: connection
     }}
  end

  @impl GenServer
  def handle_info({:connected, _connection}, %__MODULE__{} = state) do
    Enum.each(state.on_connect_subscribers, &send(&1, {:connected, self()}))

    {:noreply, state}
  end

  def handle_info({:disconnected, _, _reason}, state) do
    {:noreply, state}
  end

  @impl GenServer
  def handle_call(
        {:new_modification, %{is_draft?: is_draft?, modification: modification}},
        _from,
        %__MODULE__{connection: connection} = state
      )
      when not is_nil(connection) do
    id = Ecto.UUID.generate()

    res =
      Skate.MqttConnection.publish(connection, %EmqttFailover.Message{
        topic: trip_modification_topic(id),
        payload:
          Jason.encode!(%{
            data: modification,
            meta: %{
              is_draft?: is_draft?
            }
          }),
        # Send at least once
        qos: 1
      })

    {
      :reply,
      {res, id},
      state
    }
  end

  def trip_modification_topic(id), do: "#{trip_modifications_topic(id)}/trip_modification"
  defp trip_modifications_topic(id), do: "trip_modifications/#{id}"
end
