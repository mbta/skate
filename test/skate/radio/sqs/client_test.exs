defmodule Skate.Radio.SQS.ClientTest do
  use ExUnit.Case, async: false
  import ExUnit.CaptureLog
  import Mox
  import Test.Support.Helpers, only: [set_log_level: 1]

  alias Skate.Radio.SQS.Client

  @queue_attributes_xml """
  <GetQueueAttributesResponse>
    <GetQueueAttributesResult>
      <Attribute>
        <Name>QueueArn</Name>
        <Value>arn:aws:sqs:us-east-1:123456789012:test_queue</Value>
      </Attribute>
    </GetQueueAttributesResult>
  </GetQueueAttributesResponse>
  """

  @send_message_xml """
  <SendMessageResponse>
    <SendMessageResult>
      <MD5OfMessageBody>fafb00f573234a64021191f8011367c3</MD5OfMessageBody>
      <MD5OfMessageAttributes>3ae8f24a165a8ced76e034d15e1265e0</MD5OfMessageAttributes>
      <MessageId>5fea7743-dd80-46e3-ac0f-d20f7f7cd347</MessageId>
    </SendMessageResult>
    <ResponseMetadata>
      <RequestId>27daac76-34dd-4714-af61-ff7997666ba6</RequestId>
    </ResponseMetadata>
  </SendMessageResponse>
  """

  @telemetry_events [
    [:skate, :radio, :sqs, :connection, :start],
    [:skate, :radio, :sqs, :connection, :success],
    [:skate, :radio, :sqs, :connection, :failure],
    [:skate, :radio, :sqs, :publish, :start],
    [:skate, :radio, :sqs, :publish, :success],
    [:skate, :radio, :sqs, :publish, :failure]
  ]

  setup :set_mox_global
  setup :verify_on_exit!

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

      Mox.expect(ExAws.Request.HttpMock, :request, 2, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 200, body: @queue_attributes_xml}}
      end)

      options = [
        enabled?: true,
        name: :test_sqs_client_success,
        commands_queue_url: commands_queue_url,
        events_queue_url: events_queue_url,
        initial_delay_milliseconds: 0,
        maximum_delay_milliseconds: 0
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

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 408, body: "Request Timeout"}}
      end)

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 408, body: "Request Timeout"}}
      end)

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 200, body: @queue_attributes_xml}}
      end)

      options = [
        enabled?: true,
        name: :test_sqs_client_retries,
        commands_queue_url: commands_queue_url,
        events_queue_url: nil,
        initial_delay_milliseconds: 0,
        maximum_delay_milliseconds: 0,
        maximum_attempts: 5
      ]

      assert {:ok, client_process} = Client.start_link(options)

      # Drain the continue message
      _status_map = Client.get_connection_status(client_process)

      assert_receive {[:skate, :radio, :sqs, :connection, :success], _reference, %{attempts: 3},
                      %{queue_type: :commands, queue_url: ^commands_queue_url}}

      status_map = Client.get_connection_status(client_process)
      assert status_map == %{commands_queue: :connected, events_queue: :not_configured}

      GenServer.stop(client_process)
    end

    test "exhausts retries on persistent failure and emits failure telemetry" do
      commands_queue_url = "https://sqs.us-east-1.amazonaws.com/123456789012/commands_queue"

      Mox.expect(ExAws.Request.HttpMock, :request, 3, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 403, body: "Forbidden"}}
      end)

      options = [
        enabled?: true,
        name: :test_sqs_client_failure,
        commands_queue_url: commands_queue_url,
        events_queue_url: nil,
        initial_delay_milliseconds: 0,
        maximum_delay_milliseconds: 0,
        maximum_attempts: 3
      ]

      assert {:ok, client_process} = Client.start_link(options)

      # Drain the continue message
      _status_map = Client.get_connection_status(client_process)

      assert_receive {[:skate, :radio, :sqs, :connection, :failure], _reference, %{attempts: 3},
                      %{
                        queue_type: :commands,
                        queue_url: ^commands_queue_url,
                        error_reason: {:http_error, 403, "Forbidden"}
                      }}

      status_map = Client.get_connection_status(client_process)
      assert status_map == %{commands_queue: :failed, events_queue: :not_configured}

      GenServer.stop(client_process)
    end
  end

  describe "publish_message/2 and publish_heartbeat/1" do
    test "publishes a heartbeat message to the commands queue and emits telemetry" do
      commands_queue_url = "https://sqs.us-east-1.amazonaws.com/123456789012/commands_queue"

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 200, body: @queue_attributes_xml}}
      end)

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, body, _headers, _opts ->
        assert body =~ "Action=SendMessage"
        assert body =~ "ready"
        {:ok, %{status_code: 200, body: @send_message_xml}}
      end)

      options = [
        enabled?: true,
        name: :test_sqs_client_publish,
        commands_queue_url: commands_queue_url,
        events_queue_url: nil,
        initial_delay_milliseconds: 0,
        maximum_delay_milliseconds: 0,
        heartbeat_interval_milliseconds: nil
      ]

      assert {:ok, client_process} = Client.start_link(options)

      _status_map = Client.get_connection_status(client_process)

      assert {:ok, response} = Client.publish_heartbeat(server: client_process)
      assert response.body.message_id == "5fea7743-dd80-46e3-ac0f-d20f7f7cd347"

      assert_receive {[:skate, :radio, :sqs, :publish, :start], _reference, _measurements,
                      %{
                        queue_url: ^commands_queue_url,
                        message_type: "Heartbeat",
                        message_identifier: _
                      }}

      assert_receive {[:skate, :radio, :sqs, :publish, :success], _reference,
                      %{duration_microseconds: _},
                      %{
                        queue_url: ^commands_queue_url,
                        message_type: "Heartbeat",
                        message_identifier: _,
                        message_id: "5fea7743-dd80-46e3-ac0f-d20f7f7cd347"
                      }}

      GenServer.stop(client_process)
    end

    test "emits failure telemetry on publish error" do
      commands_queue_url = "https://sqs.us-east-1.amazonaws.com/123456789012/commands_queue"

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 200, body: @queue_attributes_xml}}
      end)

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 403, body: "Forbidden"}}
      end)

      options = [
        enabled?: true,
        name: :test_sqs_client_publish_error,
        commands_queue_url: commands_queue_url,
        events_queue_url: nil,
        initial_delay_milliseconds: 0,
        maximum_delay_milliseconds: 0,
        heartbeat_interval_milliseconds: nil
      ]

      assert {:ok, client_process} = Client.start_link(options)

      _status_map = Client.get_connection_status(client_process)

      assert {:error, {:http_error, 403, "Forbidden"}} =
               Client.publish_heartbeat(server: client_process)

      assert_receive {[:skate, :radio, :sqs, :publish, :failure], _reference,
                      %{duration_microseconds: _},
                      %{
                        queue_url: ^commands_queue_url,
                        message_type: "Heartbeat",
                        message_identifier: _,
                        error_reason: {:http_error, 403, "Forbidden"}
                      }}

      GenServer.stop(client_process)
    end

    test "periodic heartbeat fires and publishes according to configured interval" do
      commands_queue_url = "https://sqs.us-east-1.amazonaws.com/123456789012/commands_queue"

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 200, body: @queue_attributes_xml}}
      end)

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 200, body: @send_message_xml}}
      end)

      options = [
        enabled?: true,
        name: :test_sqs_client_timer_publish,
        commands_queue_url: commands_queue_url,
        events_queue_url: nil,
        initial_delay_milliseconds: 0,
        maximum_delay_milliseconds: 0,
        heartbeat_interval_milliseconds: 10
      ]

      assert {:ok, client_process} = Client.start_link(options)

      assert_receive {[:skate, :radio, :sqs, :publish, :success], _reference,
                      %{duration_microseconds: _},
                      %{
                        queue_url: ^commands_queue_url,
                        message_type: "Heartbeat",
                        message_id: "5fea7743-dd80-46e3-ac0f-d20f7f7cd347"
                      }}

      # Stop the process immediately to prevent subsequent periodic ticks from exceeding expectations
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
    end

    test "attaches and detaches custom handler identifier cleanly" do
      custom_handler_identifier = "custom_test_radio_sqs_handler"
      assert :ok = Client.Telemetry.attach_handler(custom_handler_identifier)
      assert :ok = Client.Telemetry.detach_handler(custom_handler_identifier)
    end
  end
end
