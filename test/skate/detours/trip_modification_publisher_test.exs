defmodule Skate.Detours.TripModificationPublisherTest do
  @moduledoc false
  use ExUnit.Case, async: true

  alias Skate.MqttConnection
  alias Skate.Detours.TripModificationPublisher
  alias Realtime.TripModification
  alias Realtime.Shape

  doctest TripModificationPublisher

  describe "start_link/1" do
    test "is ignored if start is not true" do
      assert :ignore = TripModificationPublisher.start_link(name: __MODULE__)
    end

    test "starts if provided start: true" do
      assert {:ok, _pid} = TripModificationPublisher.start_link(start: true, name: __MODULE__)
    end
  end

  # Make Integration tests run
  @tag "Test.Integration": :mqtt
  test "sends :connected to :on_connect subscribers when connected" do
    {:ok, pid} =
      TripModificationPublisher.start_link(start: true, name: __MODULE__, on_connect: self())

    assert_receive {:connected, ^pid}, 1000
  end

  @tag "Test.Integration": :mqtt
  test "can publish as draft via metadata" do
    {:ok, reader_pid} =
      MqttConnection.start_link([
        "trip_modifications/+/trip_modification",
        "trip_modifications/+/shape"
      ])

    {:ok, pid} =
      TripModificationPublisher.start_link(start: true, name: __MODULE__, on_connect: self())

    assert_receive {:connected, ^pid}, 1000
    assert_receive {:connected, ^reader_pid}

    trip_modification_message = %TripModification{
      selected_trips: [
        %TripModification.SelectedTrip{
          trip_ids: ["39-0-0-1"],
          shape_id: "id-of-the-shape"
        }
      ],
      service_dates: [Date.to_iso8601(Date.utc_today(), :basic)],
      modifications: [
        %TripModification.Modification{
          start_stop_selector: %TripModification.StopSelector{stop_id: "1234"},
          end_stop_selector: %TripModification.StopSelector{stop_id: "1236"},
          last_modified_time: DateTime.to_unix(DateTime.utc_now())
        }
      ]
    }

    shape_message = %Shape{
      shape_id: "shape_id_1",
      encoded_polyline: "gc}aGnfhpLod@?fE~{B_q@?gE_|Bod@?"
    }

    {:ok, id} =
      TripModificationPublisher.publish_modification(
        trip_modification_message,
        shape_message,
        is_draft?: true,
        server: pid
      )

    expected_tm_topic =
      id |> TripModificationPublisher.trip_modification_topic() |> MqttConnection.prefix_topic()

    assert_receive {:message, ^reader_pid,
                    %EmqttFailover.Message{payload: incoming_message, topic: ^expected_tm_topic}}

    trip_modification_message =
      trip_modification_message
      |> Jason.encode!()
      |> Jason.decode!()

    assert %{"data" => ^trip_modification_message, "meta" => %{"is_draft?" => true}} =
             Jason.decode!(incoming_message)

    expected_shape_topic =
      id |> TripModificationPublisher.shape_topic() |> MqttConnection.prefix_topic()

    assert_receive {:message, ^reader_pid,
                    %EmqttFailover.Message{
                      payload: incoming_message,
                      topic: ^expected_shape_topic
                    }}

    shape_message =
      shape_message
      |> Jason.encode!()
      |> Jason.decode!()

    assert %{"data" => ^shape_message} =
             Jason.decode!(incoming_message)
  end
end
