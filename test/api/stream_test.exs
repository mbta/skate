defmodule Api.StreamTest do
  use ExUnit.Case, async: false
  import Test.Support.Helpers
  alias ServerSentEventStage, as: SSES

  describe "build_options" do
    setup do
      reassign_env(:skate, :api_url, "http://example.com")
      reassign_env(:skate, :api_key, "12345678")
    end

    test "builds the URL and includes api key" do
      opts = Api.Stream.build_options(path: "/vehicles")
      assert Keyword.get(opts, :url) == "http://example.com/vehicles"
      assert <<_::binary>> = Keyword.get(opts, :api_key)
    end
  end

  describe "start_link" do
    @data %{
      "attributes" => [],
      "type" => "vehicle",
      "id" => "vehicle"
    }

    test "starts a genserver that sends events" do
      data = @data

      assert {:ok, sses} =
               GenStage.from_enumerable([
                 %SSES.Event{
                   event: "reset",
                   data: Jason.encode!(data)
                 }
               ])

      assert {:ok, pid} = Api.Stream.start_link(name: __MODULE__, subscribe_to: sses)

      assert [%Api.Stream.Event{}] =
               [pid]
               |> GenStage.stream()
               |> Enum.take(1)
    end

    test "handles api events" do
      data = @data

      assert {:ok, sses} =
               GenStage.from_enumerable([
                 %SSES.Event{event: "ignores unexpected events"},
                 # garbled data contains no data and the `event` is `message`
                 %SSES.Event{event: "message"},
                 %SSES.Event{event: "reset", data: Jason.encode!([data])},
                 %SSES.Event{event: "add", data: Jason.encode!(data)},
                 %SSES.Event{event: "update", data: Jason.encode!(data)},
                 %SSES.Event{event: "remove", data: Jason.encode!(data)}
               ])

      assert {:ok, pid} = Api.Stream.start_link(name: __MODULE__, subscribe_to: sses)

      assert [
               %Api.Stream.Event{event: :reset},
               %Api.Stream.Event{event: :add},
               %Api.Stream.Event{event: :update},
               %Api.Stream.Event{event: :remove}
             ] = [pid] |> GenStage.stream() |> Enum.take(4)
    end
  end
end
