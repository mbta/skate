defmodule Skate.Radio.SQS.Messages.HeartbeatTest do
  use ExUnit.Case, async: true

  alias Skate.Radio.SQS.Messages.Heartbeat

  describe "new/1" do
    test "constructs a valid Heartbeat struct with default values" do
      heartbeat = Heartbeat.new()

      assert is_binary(heartbeat.message_identifier)
      assert {:ok, _} = Ecto.UUID.cast(heartbeat.message_identifier)
      assert heartbeat.status == "ready"
      assert is_binary(heartbeat.instance_identifier)
      assert heartbeat.version == "2026-10-20"
      assert {:ok, _datetime, _offset} = DateTime.from_iso8601(heartbeat.timestamp)
    end

    test "allows overriding attributes" do
      custom_identifier = "custom-uuid-123"
      custom_status = "alive"
      custom_instance = "container-456"
      custom_timestamp = "2026-10-20T12:00:00Z"
      custom_version = "2026-10-21"

      heartbeat =
        Heartbeat.new(
          message_identifier: custom_identifier,
          status: custom_status,
          instance_identifier: custom_instance,
          timestamp: custom_timestamp,
          version: custom_version
        )

      assert heartbeat.message_identifier == custom_identifier
      assert heartbeat.status == custom_status
      assert heartbeat.instance_identifier == custom_instance
      assert heartbeat.timestamp == custom_timestamp
      assert heartbeat.version == custom_version
    end

    test "serializes to JSON using Jason" do
      heartbeat =
        Heartbeat.new(
          message_identifier: "00000000-0000-0000-0000-000000000000",
          status: "ready",
          instance_identifier: "test-host",
          timestamp: "2026-10-20T12:00:00Z",
          version: "2026-10-20"
        )

      encoded_json = Jason.encode!(heartbeat)
      decoded_map = Jason.decode!(encoded_json)

      assert decoded_map == %{
               "message_identifier" => "00000000-0000-0000-0000-000000000000",
               "status" => "ready",
               "instance_identifier" => "test-host",
               "timestamp" => "2026-10-20T12:00:00Z",
               "version" => "2026-10-20"
             }
    end
  end
end
