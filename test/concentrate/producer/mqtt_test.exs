defmodule Concentrate.Producer.MqttTest do
  @moduledoc false
  use ExUnit.Case

  alias Concentrate.Producer.Mqtt

  setup do
    old_level = Logger.level()
    on_exit(fn -> Logger.configure(level: old_level) end)
    Logger.configure(level: :warning)

    :ok
  end

  defp broker_configs do
    [EmqttFailover.Config.from_url("mqtt://localhost", username: "system", password: "manager")]
  end

  @tag "Test.Integration": :mqtt
  test "can dispatch events from an MQTT stream" do
    topic = "test/topic/#{System.unique_integer()}"

    opts = [
      broker_configs: broker_configs(),
      topics: [topic],
      parser: __MODULE__.PassThroughParser
    ]

    # Start the producer
    {:ok, pid} = Mqtt.start_link(opts)

    # Allow time for connection and subscription to complete
    Process.sleep(500)

    # Publish a message to the topic
    {:ok, writer} =
      :emqtt.start_link(%{
        host: "localhost",
        username: "system",
        password: "manager",
        port: 1883
      })

    {:ok, _} = :emqtt.connect(writer)
    :emqtt.publish(writer, topic, "payload", qos: 0)

    # Verify we receive it via GenStage stream
    [[{:parsed, body}]] = Enum.take(GenStage.stream([pid]), 1)
    assert body == "payload"

    :emqtt.disconnect(writer)
  end

  @tag "Test.Integration": :mqtt
  test "can accept a function as a parser" do
    topic = "test/topic/#{System.unique_integer()}"

    opts = [
      broker_configs: broker_configs(),
      topics: [topic],
      parser: &__MODULE__.PassThroughParser.parse/1
    ]

    {:ok, pid} = Mqtt.start_link(opts)

    # Allow time for connection and subscription to complete
    Process.sleep(500)

    {:ok, writer} =
      :emqtt.start_link(%{
        host: "localhost",
        username: "system",
        password: "manager",
        port: 1883
      })

    {:ok, _} = :emqtt.connect(writer)
    :emqtt.publish(writer, topic, "payload", qos: 0)

    [[{:parsed, body}]] = Enum.take(GenStage.stream([pid]), 1)
    assert body == "payload"

    :emqtt.disconnect(writer)
  end

  @tag "Test.Integration": :mqtt
  test "can accept gzip-encoded payloads" do
    topic = "test/topic/#{System.unique_integer()}"
    payload = "payload"

    opts = [
      broker_configs: broker_configs(),
      topics: [topic],
      parser: __MODULE__.PassThroughParser
    ]

    {:ok, pid} = Mqtt.start_link(opts)

    # Allow time for connection and subscription to complete
    Process.sleep(500)

    {:ok, writer} =
      :emqtt.start_link(%{
        host: "localhost",
        username: "system",
        password: "manager",
        port: 1883
      })

    {:ok, _} = :emqtt.connect(writer)
    :emqtt.publish(writer, topic, :zlib.gzip(payload), qos: 0)

    assert [[{:parsed, ^payload}]] = Enum.take(GenStage.stream([pid]), 1)

    :emqtt.disconnect(writer)
  end

  defmodule PassThroughParser do
    @moduledoc false

    def parse(body) do
      [{:parsed, body}]
    end
  end
end
