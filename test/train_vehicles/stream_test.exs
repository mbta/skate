defmodule TrainVehicles.StreamTest do
  use ExUnit.Case, async: true

  @train_vehicles %JsonApi{
    data: [
      %JsonApi.Item{
        type: "vehicle",
        id: "vehicle1",
        attributes: %{
          "current_status" => "STOPPED_AT"
        },
        relationships: %{
          "route" => [%JsonApi.Item{id: "Red"}],
          "trip" => [%JsonApi.Item{id: "trip"}],
          "stop" => [%JsonApi.Item{id: "stop"}]
        }
      }
    ]
  }

  setup tags do
    {:ok, mock_api} =
      GenStage.from_enumerable([
        %Api.Stream.Event{event: :reset, data: @train_vehicles}
      ])

    name = :"stream_test_#{tags.line}"

    {:ok, mock_api: mock_api, name: name}
  end

  describe "start_link/1" do
    test "starts a GenServer that publishes train vehicles", %{mock_api: mock_api, name: name} do
      test_pid = self()

      broadcast_fn = fn TrainVehicles.PubSub, "train_vehicles", {type, data} ->
        send(test_pid, {type, data})
        :ok
      end

      assert {:ok, _} =
               TrainVehicles.Stream.start_link(
                 name: name,
                 broadcast_fn: broadcast_fn,
                 subscribe_to: mock_api
               )

      assert_receive {:reset, [%TrainVehicles.TrainVehicle{id: "vehicle1"}]}
    end

    test "publishes :remove events as a list of IDs", %{name: name} do
      {:ok, mock_api} =
        GenStage.from_enumerable([
          %Api.Stream.Event{event: :remove, data: @train_vehicles}
        ])

      test_pid = self()

      broadcast_fn = fn TrainVehicles.PubSub, "train_vehicles", {type, data} ->
        send(test_pid, {:received_broadcast, {type, data}})
        :ok
      end

      assert {:ok, _} =
               TrainVehicles.Stream.start_link(
                 name: name,
                 broadcast_fn: broadcast_fn,
                 subscribe_to: mock_api
               )

      assert_receive {:received_broadcast, {type, data}}
      assert type == :remove
      assert data == ["vehicle1"]
    end
  end
end
