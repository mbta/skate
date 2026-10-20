defmodule Skate.Radio.SQS.TelemetryTest do
  use ExUnit.Case, async: false
  import ExUnit.CaptureLog
  import Test.Support.Helpers, only: [set_log_level: 1]

  alias Skate.Radio.SQS.Telemetry

  @telemetry_test_cases [
    %{
      description: "connection start",
      event: [:skate, :radio, :sqs, :connection, :start],
      measurements: %{system_time: 1_000_000},
      metadata: %{queue_type: :commands, queue_url: "https://sqs.us-east-1.amazonaws.com/test"},
      expected_log: "Radio SQS connection check started: queue_type=commands queue_url=https://sqs.us-east-1.amazonaws.com/test"
    },
    %{
      description: "connection success",
      event: [:skate, :radio, :sqs, :connection, :success],
      measurements: %{duration_microseconds: 1_234, attempts: 1},
      metadata: %{queue_type: :commands},
      expected_log: "Radio SQS connection check succeeded: queue_type=commands duration_microseconds=1234 attempts=1"
    },
    %{
      description: "connection failure",
      event: [:skate, :radio, :sqs, :connection, :failure],
      measurements: %{attempts: 3},
      metadata: %{queue_type: :events, error_reason: :econnrefused},
      expected_log: "Radio SQS connection check failed: queue_type=events attempts=3 error_reason=:econnrefused"
    },
    %{
      description: "publish start",
      event: [:skate, :radio, :sqs, :publish, :start],
      measurements: %{system_time: 1_000_000},
      metadata: %{
        queue_url: "https://sqs.us-east-1.amazonaws.com/commands",
        message_type: "Heartbeat",
        message_identifier: "msg-123"
      },
      expected_log: "Radio SQS message publish started: message_type=Heartbeat message_identifier=msg-123 queue_url=https://sqs.us-east-1.amazonaws.com/commands"
    },
    %{
      description: "publish success",
      event: [:skate, :radio, :sqs, :publish, :success],
      measurements: %{duration_microseconds: 2_345},
      metadata: %{
        message_type: "Heartbeat",
        message_identifier: "msg-123",
        message_id: "sqs-id-456"
      },
      expected_log: "Radio SQS message publish succeeded: message_type=Heartbeat message_identifier=msg-123 message_id=sqs-id-456 duration_microseconds=2345"
    },
    %{
      description: "publish failure",
      event: [:skate, :radio, :sqs, :publish, :failure],
      measurements: %{duration_microseconds: 3_456},
      metadata: %{
        message_type: "Heartbeat",
        message_identifier: "msg-123",
        error_reason: :timeout
      },
      expected_log: "Radio SQS message publish failed: message_type=Heartbeat message_identifier=msg-123 duration_microseconds=3456 error_reason=:timeout"
    },
    %{
      description: "receive start",
      event: [:skate, :radio, :sqs, :receive, :start],
      measurements: %{},
      metadata: %{queue_url: "https://sqs.us-east-1.amazonaws.com/events"},
      expected_log: "Radio SQS receive started: queue_url=https://sqs.us-east-1.amazonaws.com/events"
    },
    %{
      description: "receive success",
      event: [:skate, :radio, :sqs, :receive, :success],
      measurements: %{duration_microseconds: 4_567, message_count: 2},
      metadata: %{queue_url: "https://sqs.us-east-1.amazonaws.com/events"},
      expected_log: "Radio SQS receive succeeded: queue_url=https://sqs.us-east-1.amazonaws.com/events message_count=2 duration_microseconds=4567"
    },
    %{
      description: "receive failure",
      event: [:skate, :radio, :sqs, :receive, :failure],
      measurements: %{duration_microseconds: 5_678},
      metadata: %{queue_url: "https://sqs.us-east-1.amazonaws.com/events", error_reason: :timeout},
      expected_log: "Radio SQS receive failed: queue_url=https://sqs.us-east-1.amazonaws.com/events duration_microseconds=5678 error_reason=:timeout"
    },
    %{
      description: "discard start",
      event: [:skate, :radio, :sqs, :discard, :start],
      measurements: %{},
      metadata: %{
        queue_url: "https://sqs.us-east-1.amazonaws.com/events",
        message_id: "msg-discard-1"
      },
      expected_log: "Radio SQS discard started: message_id=msg-discard-1 queue_url=https://sqs.us-east-1.amazonaws.com/events"
    },
    %{
      description: "discard success",
      event: [:skate, :radio, :sqs, :discard, :success],
      measurements: %{duration_microseconds: 6_789},
      metadata: %{
        queue_url: "https://sqs.us-east-1.amazonaws.com/events",
        message_id: "msg-discard-1"
      },
      expected_log: "Radio SQS discard succeeded: message_id=msg-discard-1 queue_url=https://sqs.us-east-1.amazonaws.com/events duration_microseconds=6789"
    },
    %{
      description: "discard failure",
      event: [:skate, :radio, :sqs, :discard, :failure],
      measurements: %{duration_microseconds: 7_890},
      metadata: %{
        queue_url: "https://sqs.us-east-1.amazonaws.com/events",
        message_id: "msg-discard-1",
        error_reason: :access_denied
      },
      expected_log: "Radio SQS discard failed: message_id=msg-discard-1 queue_url=https://sqs.us-east-1.amazonaws.com/events duration_microseconds=7890 error_reason=:access_denied"
    }
  ]

  describe "handle_event/4" do
    for test_case <- @telemetry_test_cases do
      @test_case test_case

      test "logs expected message on #{@test_case.description} event" do
        set_log_level(:info)

        log_output =
          capture_log([level: :info], fn ->
            :telemetry.execute(
              @test_case.event,
              @test_case.measurements,
              @test_case.metadata
            )
          end)

        assert log_output =~ @test_case.expected_log
      end
    end

    test "attaches and detaches custom handler identifier cleanly" do
      custom_handler_identifier = "custom_test_radio_sqs_handler"
      assert :ok = Telemetry.attach_handler(custom_handler_identifier)
      assert :ok = Telemetry.detach_handler(custom_handler_identifier)
    end
  end
end
