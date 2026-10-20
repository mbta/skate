defmodule Skate.Radio.SQS.ClientTest do
  use ExUnit.Case, async: false
  import ExUnit.CaptureLog
  import Test.Support.Helpers, only: [set_log_level: 1]

  alias Skate.Radio.SQS.Client

  @telemetry_events [
    [:skate, :radio, :sqs, :connection, :start],
    [:skate, :radio, :sqs, :connection, :success],
    [:skate, :radio, :sqs, :connection, :failure]
  ]

  setup do
    telemetry_reference = :telemetry_test.attach_event_handlers(self(), @telemetry_events)

    on_exit(fn ->
      :telemetry.detach(telemetry_reference)
    end)

    %{telemetry_reference: telemetry_reference}
  end

  describe "start_link/1" do
    test "returns :ignore when enabled? is false" do
      options = [
        enabled?: false,
        commands_queue_url: "https://sqs.us-east-1.amazonaws.com/123456789012/commands_queue"
      ]

      assert Client.start_link(options) == :ignore
    end

    test "verifies configured queues and emits success telemetry" do
      commands_queue_url = "https://sqs.us-east-1.amazonaws.com/123456789012/commands_queue"
      events_queue_url = "https://sqs.us-east-1.amazonaws.com/123456789012/events_queue"
      test_pid = self()

      mock_request_function = fn query ->
        send(test_pid, {:request_executed, query})
        {:ok, %{queue_arn: "arn:aws:sqs:us-east-1:123456789012:test_queue"}}
      end

      options = [
        enabled?: true,
        name: :test_sqs_client_success,
        commands_queue_url: commands_queue_url,
        events_queue_url: events_queue_url,
        request_function: mock_request_function,
        sleep_function: fn _delay_milliseconds -> :ok end
      ]

      assert {:ok, client_process} = Client.start_link(options)

      # Drain the continue message
      _status_map = Client.get_connection_status(client_process)

      assert_receive {[:skate, :radio, :sqs, :connection, :start], _reference, _measurements,
                      %{queue_type: :commands, queue_url: ^commands_queue_url}}

      assert_receive {[:skate, :radio, :sqs, :connection, :success], _reference,
                      %{duration_microseconds: _, attempts: 1},
                      %{queue_type: :commands, queue_url: ^commands_queue_url}}

      assert_receive {[:skate, :radio, :sqs, :connection, :start], _reference, _measurements,
                      %{queue_type: :events, queue_url: ^events_queue_url}}

      assert_receive {[:skate, :radio, :sqs, :connection, :success], _reference,
                      %{duration_microseconds: _, attempts: 1},
                      %{queue_type: :events, queue_url: ^events_queue_url}}

      status_map = Client.get_connection_status(client_process)
      assert status_map == %{commands_queue: :connected, events_queue: :connected}

      GenServer.stop(client_process)
    end

    test "retries on transient failure with backoff and succeeds on subsequent attempt" do
      commands_queue_url = "https://sqs.us-east-1.amazonaws.com/123456789012/commands_queue"
      test_pid = self()
      attempt_counter = :counters.new(1, [:atomics])

      mock_request_function = fn _query ->
        :counters.add(attempt_counter, 1, 1)
        current_attempt = :counters.get(attempt_counter, 1)

        if current_attempt < 3 do
          {:error, {:http_error, 500, "Internal Server Error"}}
        else
          {:ok, %{queue_arn: "arn:aws:sqs:us-east-1:123456789012:commands_queue"}}
        end
      end

      mock_sleep_function = fn delay_milliseconds ->
        send(test_pid, {:sleep_called, delay_milliseconds})
        :ok
      end

      options = [
        enabled?: true,
        name: :test_sqs_client_retries,
        commands_queue_url: commands_queue_url,
        events_queue_url: nil,
        initial_delay_milliseconds: 10,
        maximum_delay_milliseconds: 100,
        maximum_attempts: 5,
        request_function: mock_request_function,
        sleep_function: mock_sleep_function
      ]

      assert {:ok, client_process} = Client.start_link(options)

      # Drain the continue message
      _status_map = Client.get_connection_status(client_process)

      assert_receive {:sleep_called, 10}
      assert_receive {:sleep_called, 20}

      assert_receive {[:skate, :radio, :sqs, :connection, :success], _reference,
                      %{attempts: 3},
                      %{queue_type: :commands, queue_url: ^commands_queue_url}}

      status_map = Client.get_connection_status(client_process)
      assert status_map == %{commands_queue: :connected, events_queue: :not_configured}

      GenServer.stop(client_process)
    end

    test "exhausts retries on persistent failure and emits failure telemetry" do
      commands_queue_url = "https://sqs.us-east-1.amazonaws.com/123456789012/commands_queue"
      test_pid = self()

      mock_request_function = fn _query ->
        {:error, {:http_error, 403, "AccessDenied"}}
      end

      mock_sleep_function = fn delay_milliseconds ->
        send(test_pid, {:sleep_called, delay_milliseconds})
        :ok
      end

      options = [
        enabled?: true,
        name: :test_sqs_client_failure,
        commands_queue_url: commands_queue_url,
        events_queue_url: nil,
        initial_delay_milliseconds: 5,
        maximum_delay_milliseconds: 50,
        maximum_attempts: 3,
        request_function: mock_request_function,
        sleep_function: mock_sleep_function
      ]

      assert {:ok, client_process} = Client.start_link(options)

      # Drain the continue message
      _status_map = Client.get_connection_status(client_process)

      assert_receive {:sleep_called, 5}
      assert_receive {:sleep_called, 10}

      assert_receive {[:skate, :radio, :sqs, :connection, :failure], _reference,
                      %{attempts: 3},
                      %{
                        queue_type: :commands,
                        queue_url: ^commands_queue_url,
                        error_reason: {:http_error, 403, "AccessDenied"}
                      }}

      status_map = Client.get_connection_status(client_process)
      assert status_map == %{commands_queue: :failed, events_queue: :not_configured}

      GenServer.stop(client_process)
    end
  end

  describe "Telemetry handler" do
    test "logs expected messages on start, success, and failure events" do
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
        end)

      assert log_output =~ "Radio SQS connection check started: queue_type=commands"
      assert log_output =~ "Radio SQS connection check succeeded: queue_type=commands duration_microseconds=1234 attempts=1"
      assert log_output =~ "Radio SQS connection check failed: queue_type=events attempts=3 error_reason=:econnrefused"
    end

    test "attaches and detaches custom handler identifier cleanly" do
      custom_handler_identifier = "custom_test_radio_sqs_handler"
      assert :ok = Client.Telemetry.attach_handler(custom_handler_identifier)
      assert :ok = Client.Telemetry.detach_handler(custom_handler_identifier)
    end
  end
end
