defmodule Skate.Radio.SQS.TelemetryTest do
  use ExUnit.Case, async: false
  import ExUnit.CaptureLog
  import Test.Support.Helpers, only: [set_log_level: 1]

  alias Skate.Radio.SQS.Telemetry

  describe "handle_event/4" do
    test "logs expected messages across connection and publish events" do
      set_log_level(:info)

      log_output =
        capture_log([level: :info], fn ->
          :telemetry.execute(
            [:skate, :radio, :sqs, :connection, :start],
            %{system_time: System.system_time()},
            %{queue_type: :commands, queue_url: "https://sqs.us-east-1.amazonaws.com/test"}
          )

          :telemetry.execute(
            [:skate, :radio, :sqs, :connection, :success],
            %{duration_microseconds: 1_234, attempts: 1},
            %{queue_type: :commands, queue_url: "https://sqs.us-east-1.amazonaws.com/test"}
          )

          :telemetry.execute(
            [:skate, :radio, :sqs, :connection, :failure],
            %{duration_microseconds: 5_000, attempts: 3},
            %{
              queue_type: :events,
              queue_url: "https://sqs.us-east-1.amazonaws.com/events",
              error_reason: :econnrefused
            }
          )

          :telemetry.execute(
            [:skate, :radio, :sqs, :publish, :start],
            %{system_time: System.system_time()},
            %{
              queue_url: "https://sqs.us-east-1.amazonaws.com/commands",
              message_type: "Heartbeat",
              message_identifier: "msg-123"
            }
          )

          :telemetry.execute(
            [:skate, :radio, :sqs, :publish, :success],
            %{duration_microseconds: 2_345},
            %{
              queue_url: "https://sqs.us-east-1.amazonaws.com/commands",
              message_type: "Heartbeat",
              message_identifier: "msg-123",
              message_id: "sqs-id-456"
            }
          )

          :telemetry.execute(
            [:skate, :radio, :sqs, :publish, :failure],
            %{duration_microseconds: 3_456},
            %{
              queue_url: "https://sqs.us-east-1.amazonaws.com/commands",
              message_type: "Heartbeat",
              message_identifier: "msg-123",
              error_reason: :timeout
            }
          )

          :telemetry.execute(
            [:skate, :radio, :sqs, :receive, :start],
            %{system_time: System.system_time()},
            %{queue_url: "https://sqs.us-east-1.amazonaws.com/events"}
          )

          :telemetry.execute(
            [:skate, :radio, :sqs, :receive, :success],
            %{duration_microseconds: 4_567, message_count: 2},
            %{queue_url: "https://sqs.us-east-1.amazonaws.com/events"}
          )

          :telemetry.execute(
            [:skate, :radio, :sqs, :receive, :failure],
            %{duration_microseconds: 5_678},
            %{queue_url: "https://sqs.us-east-1.amazonaws.com/events", error_reason: :timeout}
          )

          :telemetry.execute(
            [:skate, :radio, :sqs, :discard, :start],
            %{system_time: System.system_time()},
            %{
              queue_url: "https://sqs.us-east-1.amazonaws.com/events",
              message_id: "msg-discard-1"
            }
          )

          :telemetry.execute(
            [:skate, :radio, :sqs, :discard, :success],
            %{duration_microseconds: 6_789},
            %{
              queue_url: "https://sqs.us-east-1.amazonaws.com/events",
              message_id: "msg-discard-1"
            }
          )

          :telemetry.execute(
            [:skate, :radio, :sqs, :discard, :failure],
            %{duration_microseconds: 7_890},
            %{
              queue_url: "https://sqs.us-east-1.amazonaws.com/events",
              message_id: "msg-discard-1",
              error_reason: :access_denied
            }
          )
        end)

      assert log_output =~ "Radio SQS connection check started: queue_type=commands"

      assert log_output =~
               "Radio SQS connection check succeeded: queue_type=commands duration_microseconds=1234 attempts=1"

      assert log_output =~
               "Radio SQS connection check failed: queue_type=events attempts=3 error_reason=:econnrefused"

      assert log_output =~
               "Radio SQS message publish started: message_type=Heartbeat message_identifier=msg-123"

      assert log_output =~
               "Radio SQS message publish succeeded: message_type=Heartbeat message_identifier=msg-123 message_id=sqs-id-456"

      assert log_output =~
               "Radio SQS message publish failed: message_type=Heartbeat message_identifier=msg-123 duration_microseconds=3456 error_reason=:timeout"

      assert log_output =~
               "Radio SQS receive started: queue_url=https://sqs.us-east-1.amazonaws.com/events"

      assert log_output =~
               "Radio SQS receive succeeded: queue_url=https://sqs.us-east-1.amazonaws.com/events message_count=2 duration_microseconds=4567"

      assert log_output =~
               "Radio SQS receive failed: queue_url=https://sqs.us-east-1.amazonaws.com/events duration_microseconds=5678 error_reason=:timeout"

      assert log_output =~
               "Radio SQS discard started: message_id=msg-discard-1 queue_url=https://sqs.us-east-1.amazonaws.com/events"

      assert log_output =~
               "Radio SQS discard succeeded: message_id=msg-discard-1 queue_url=https://sqs.us-east-1.amazonaws.com/events duration_microseconds=6789"

      assert log_output =~
               "Radio SQS discard failed: message_id=msg-discard-1 queue_url=https://sqs.us-east-1.amazonaws.com/events duration_microseconds=7890 error_reason=:access_denied"
    end

    test "attaches and detaches custom handler identifier cleanly" do
      custom_handler_identifier = "custom_test_radio_sqs_handler"
      assert :ok = Telemetry.attach_handler(custom_handler_identifier)
      assert :ok = Telemetry.detach_handler(custom_handler_identifier)
    end
  end
end
