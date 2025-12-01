defmodule Concentrate.PipelineTest do
  use ExUnit.Case, async: true

  alias Concentrate.Pipeline

  describe "source/4" do
    test "builds a child_spec for an HTTP Producer" do
      child_spec =
        Pipeline.source(
          :test_name,
          "http://example.com",
          Concentrate.Parser.GTFSRealtimeEnhanced
        )

      assert %{
               id: :test_name,
               start:
                 {HttpStage, :start_link,
                  [
                    {"http://example.com",
                     [name: :test_name, parser: Concentrate.Parser.GTFSRealtimeEnhanced]}
                  ]}
             } = child_spec
    end
  end

  describe "consumer/2" do
    test "builds a child_spec" do
      child_spec = Pipeline.consumer(Concentrate.Consumer.StopTimeUpdates, :test_provider)

      assert %{
               start:
                 {Concentrate.Consumer.StopTimeUpdates, :start_link,
                  [[subscribe_to: [test_provider: [max_demand: 1]]]]}
             } = child_spec
    end
  end
end
