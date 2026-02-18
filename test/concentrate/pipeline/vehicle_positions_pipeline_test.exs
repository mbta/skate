defmodule Concentrate.Pipeline.VehiclePositionsPipelineTest do
  use ExUnit.Case
  import Test.Support.Helpers

  describe "init/1" do
    setup do
      reassign_env(:realtime, :trip_fn, fn _trip_id -> nil end)
      reassign_env(:realtime, :block_fn, fn _block_id, _service_id -> nil end)
    end

    test "includes 2 sources, merge, and 1 consumer in the pipeline" do
      opts = [
        busloc_url: "http://example.com/busloc.json",
        swiftly_authorization_key: "12345",
        swiftly_realtime_vehicles_url: "http://example.com/swiftly_realtime_vehicles.json"
      ]

      pipeline_elements = Concentrate.Pipeline.VehiclePositionsPipeline.init(opts)

      assert length(pipeline_elements) == 4
    end

    test "uses MQTT source when busloc_topic and broker_configs are present" do
      broker_configs = [
        EmqttFailover.Config.from_url("mqtt://host:1883", username: "user", password: "pass")
      ]

      opts = [
        busloc_topic: "topic/path",
        broker_configs: broker_configs,
        swiftly_authorization_key: "12345",
        swiftly_realtime_vehicles_url: "http://example.com/swiftly_realtime_vehicles.json"
      ]

      pipeline_elements = Concentrate.Pipeline.VehiclePositionsPipeline.init(opts)

      assert length(pipeline_elements) == 4

      mqtt_child =
        Enum.find(pipeline_elements, fn
          %{start: {Concentrate.Producer.Mqtt, :start_link, [opts]}} ->
            opts[:topics] == ["topic/path"] and opts[:broker_configs] == broker_configs

          _ ->
            false
        end)

      assert mqtt_child
    end

    test "uses HTTP source when busloc_url is present but no busloc_topic" do
      opts = [
        busloc_url: "http://example.com/busloc.json",
        broker_configs: [EmqttFailover.Config.from_url("mqtt://host:1883")],
        swiftly_authorization_key: "12345",
        swiftly_realtime_vehicles_url: "http://example.com/swiftly_realtime_vehicles.json"
      ]

      pipeline_elements = Concentrate.Pipeline.VehiclePositionsPipeline.init(opts)

      http_child =
        Enum.find(pipeline_elements, fn
          %{start: {HttpStage, :start_link, _}} -> true
          _ -> false
        end)

      assert http_child
    end
  end
end
