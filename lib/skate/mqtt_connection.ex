defmodule Skate.MqttConnection do
  @moduledoc """
  Shared functionality to connect to the MQTT broker.

  Sourced From: https://github.com/mbta/ride_along/blob/ffdb1007332c3eaf6f36244531468f67333bc292/lib/ride_along/mqtt_connection.ex
  """

  @type on_start :: GenServer.on_start()
  @type server :: GenServer.server()

  @spec start_link(listen_topics :: [String.t()]) :: on_start()
  def start_link(topics \\ []) do
    app_config = app_config()

    EmqttFailover.Connection.start_link(
      configs: app_config[:broker_configs],
      client_id: EmqttFailover.client_id(prefix: app_config[:broker_client_prefix]),
      backoff: {1_000, 60_000, :jitter},
      handler: {EmqttFailover.ConnectionHandler.Parent, parent: self(), topics: topics}
    )
  end

  @spec publish(server(), EmqttFailover.Message.t()) :: :ok | {:error, term()}
  def publish(connection, message) do
    EmqttFailover.Connection.publish(connection, prefix_topic(message))
  end

  @spec prefix_topic(EmqttFailover.Message.t()) :: EmqttFailover.Message.t()
  @spec prefix_topic(binary()) :: binary()
  def prefix_topic(%EmqttFailover.Message{topic: topic} = message) do
    %{
      message
      | topic: prefix_topic(topic)
    }
  end

  def prefix_topic(topic) when is_binary(topic), do: (topic_prefix() || "") <> topic

  def topic_prefix, do: app_config()[:broker_topic_prefix]

  defp app_config, do: Application.get_env(:skate, __MODULE__)
end
