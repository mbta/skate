defmodule Skate.Detours.TripModificationPublisherTest do
  @moduledoc false
  use ExUnit.Case, async: true

  alias Skate.MqttConnection
  alias Skate.Detours.TripModificationPublisher
  alias Realtime.TripModification

  # https://elixirforum.com/t/how-to-assert-some-process-received-some-message/1779/5
  # We need to wait for `MqttConnection` to start, but that message is hidden
  # within the `TripModificationPublisher` GenServer.
  # To be able to wait for the connection, we need to trace messages sent to
  # that process.
  defmacro assert_process_receive(pid, message, fun) do
    quote do
      :erlang.trace(unquote(pid), true, [:receive])
      unquote(fun).()
      assert_receive({:trace, ^unquote(pid), :receive, message})
    end
  end

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

    assert_receive {:connected, ^pid}
  end

  @tag "Test.Integration": :mqtt
  test "can publish as draft via metadata" do
    {:ok, reader_pid} = MqttConnection.start_link(["trip_modifications/+/trip_modification"])

    {:ok, pid} =
      TripModificationPublisher.start_link(start: true, name: __MODULE__, on_connect: self())

    assert_receive {:connected, ^pid}

    last_modified_time = DateTime.utc_now()
    service_date = Date.utc_today()

    message = %TripModification{
      selected_trips: [
        %TripModification.SelectedTrip{
          trip_ids: ["39-0-0-1"],
          shape_id: "id-of-the-shape"
        }
      ],
      service_dates: [Date.to_iso8601(service_date, :basic)],
      modifications: [
        %TripModification.Modification{
          start_stop_selector: %TripModification.StopSelector{stop_id: "1234"},
          end_stop_selector: %TripModification.StopSelector{stop_id: "1236"},
          last_modified_time: DateTime.to_unix(last_modified_time)
        }
      ]
    }

    TripModificationPublisher.publish_modification(
      message,
      is_draft?: true,
      server: pid
    )

    assert_receive {:connected, ^reader_pid}

    assert_receive {:message, ^reader_pid, %EmqttFailover.Message{payload: incoming_message}}

    message =
      message
      |> Jason.encode!()
      |> Jason.decode!()

    assert %{"data" => ^message, "meta" => %{"is_draft?" => true}} =
             Jason.decode!(incoming_message)
  end
end
