defmodule Skate.Detours.TripModificationPublisher do
  @moduledoc """
  Connects to the MQTT Broker, then allows sending `Realtime.TripModification`'s
  to the Broker.

  References: https://github.com/mbta/ride_along/blob/fb440fb15dce22921fc4a141a125f3645da98b26/lib/ride_along/sql_publisher.ex

  ## Testing
  To "unit test" this code, you must have an MQTT broker running locally, or
  configure URL's for a MQTT Broker which you have access too.

  By default, these "integration tests" are excluded from the test suite,
  under the tag `"Test.Integration": :mqtt`. So to run these tests
  `--include 'Test.Integration:mqtt'` to run only the MQTT tests;
  or you can use `--include 'Test.Integration'` to target all instances of
  this tag.

  ### Example:

  > #### Note {: .tip}
  > This example requires that you have the `mosquitto` mqtt broker binary in
  > your `$PATH`.
  >
  > Ex: `brew install mosquitto`

  ```sh
  # Start and run `mosquitto` broker in the background
  mosquitto &
  # Wait for `mosquitto` to launch then launch integration tests with
  mix test --include 'Test.Integration' test/skate/detours/trip_modification_publisher_test.exs
  ```

  Alternatively, instead of running something locally with the default
  `config :skate, Skate.MqttConnection` config in `config/config.exs` configuration;
  You can configure the `config :skate, Skate.MqttConnection` in
  `config/runtime.exs` to run in the `Mix` env `:dev` and configure those
  environment variables locally to connect to a different Broker;
  Or you can edit the config `config/dev.exs` to statically configure it for
  local development
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
        %Realtime.Shape{} = shape,
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
          modification: modification,
          shape: shape
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
        {:new_modification, %{is_draft?: is_draft?, modification: modification, shape: shape}},
        _from,
        %__MODULE__{connection: connection} = state
      )
      when not is_nil(connection) do
    id = Ecto.UUID.generate()

    res =
      with :ok <-
             Skate.MqttConnection.publish(connection, %EmqttFailover.Message{
               topic: shape_topic(id),
               payload:
                 Jason.encode!(%{
                   data: shape
                 }),
               # Send at least once
               qos: 1
             }),
           :ok <-
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
             }) do
        :ok
      else
        res -> res
      end

    {
      :reply,
      {res, id},
      state
    }
  end

  def trip_modification_topic(id), do: "#{trip_modifications_topic(id)}/trip_modification"
  def shape_topic(id), do: "#{trip_modifications_topic(id)}/shape"
  defp trip_modifications_topic(id), do: "trip_modifications/#{id}"
end
