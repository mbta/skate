defmodule Skate.Radio.SQS.ClientTest do
  use ExUnit.Case, async: false
  import Mox
  import Test.Support.Radio.SQSFixtures

  alias Skate.Radio.SQS.Client

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
        commands_queue_url: commands_queue_url()
      ]

      assert Client.start_link(options) == :ignore
    end

    test "verifies configured queues and emits success telemetry" do
      commands_url = commands_queue_url()
      events_url = events_queue_url()

      Mox.expect(ExAws.Request.HttpMock, :request, 2, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 200, body: queue_attributes_xml()}}
      end)

      options = [
        enabled?: true,
        name: :test_sqs_client_success,
        commands_queue_url: commands_url,
        events_queue_url: events_url,
        initial_delay_milliseconds: 0,
        maximum_delay_milliseconds: 0
      ]

      assert {:ok, client_process} = Client.start_link(options)

      # Drain the continue message
      _status_map = Client.get_connection_status(client_process)

      assert_receive {[:skate, :radio, :sqs, :connection, :start], _reference, _measurements,
                      %{queue_type: :commands, queue_url: ^commands_url}}

      assert_receive {[:skate, :radio, :sqs, :connection, :success], _reference,
                      %{duration_microseconds: _, attempts: 1},
                      %{queue_type: :commands, queue_url: ^commands_url}}

      assert_receive {[:skate, :radio, :sqs, :connection, :start], _reference, _measurements,
                      %{queue_type: :events, queue_url: ^events_url}}

      assert_receive {[:skate, :radio, :sqs, :connection, :success], _reference,
                      %{duration_microseconds: _, attempts: 1},
                      %{queue_type: :events, queue_url: ^events_url}}

      status_map = Client.get_connection_status(client_process)
      assert status_map == %{commands_queue: :connected, events_queue: :connected}

      GenServer.stop(client_process)
    end

    test "retries on transient failure with backoff and succeeds on subsequent attempt" do
      commands_url = commands_queue_url()

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 408, body: "Request Timeout"}}
      end)

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 408, body: "Request Timeout"}}
      end)

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 200, body: queue_attributes_xml()}}
      end)

      options = [
        enabled?: true,
        name: :test_sqs_client_retries,
        commands_queue_url: commands_url,
        events_queue_url: nil,
        initial_delay_milliseconds: 0,
        maximum_delay_milliseconds: 0,
        maximum_attempts: 5
      ]

      assert {:ok, client_process} = Client.start_link(options)

      # Drain the continue message
      _status_map = Client.get_connection_status(client_process)

      assert_receive {[:skate, :radio, :sqs, :connection, :success], _reference, %{attempts: 3},
                      %{queue_type: :commands, queue_url: ^commands_url}}

      status_map = Client.get_connection_status(client_process)
      assert status_map == %{commands_queue: :connected, events_queue: :not_configured}

      GenServer.stop(client_process)
    end

    test "exhausts retries on persistent failure and emits failure telemetry" do
      commands_url = commands_queue_url()

      Mox.expect(ExAws.Request.HttpMock, :request, 3, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 403, body: "Forbidden"}}
      end)

      options = [
        enabled?: true,
        name: :test_sqs_client_failure,
        commands_queue_url: commands_url,
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
                        queue_url: ^commands_url,
                        error_reason: {:http_error, 403, "Forbidden"}
                      }}

      status_map = Client.get_connection_status(client_process)
      assert status_map == %{commands_queue: :failed, events_queue: :not_configured}

      GenServer.stop(client_process)
    end
  end

  describe "periodic heartbeat timer" do
    test "fires and publishes heartbeat according to configured interval" do
      commands_url = commands_queue_url()

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 200, body: queue_attributes_xml()}}
      end)

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, body, _headers, _opts ->
        assert body =~ "Action=SendMessage"
        assert body =~ "ready"
        {:ok, %{status_code: 200, body: send_message_xml()}}
      end)

      options = [
        enabled?: true,
        name: :test_sqs_client_timer_publish,
        commands_queue_url: commands_url,
        events_queue_url: nil,
        initial_delay_milliseconds: 0,
        maximum_delay_milliseconds: 0,
        heartbeat_interval_milliseconds: 10
      ]

      assert {:ok, client_process} = Client.start_link(options)

      assert_receive {[:skate, :radio, :sqs, :publish, :success], _reference,
                      %{duration_microseconds: _},
                      %{
                        queue_url: ^commands_url,
                        message_type: "Heartbeat",
                        message_id: "5fea7743-dd80-46e3-ac0f-d20f7f7cd347"
                      }}

      GenServer.stop(client_process)
    end
  end

  describe "client delegation helpers" do
    test "publish_heartbeat/1 delegates to Publisher" do
      commands_url = commands_queue_url()

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, body, _headers, _opts ->
        assert body =~ "Action=SendMessage"
        {:ok, %{status_code: 200, body: send_message_xml()}}
      end)

      assert {:ok, response} =
               Client.publish_heartbeat(queue_url: commands_url)

      assert response.body.message_id == "5fea7743-dd80-46e3-ac0f-d20f7f7cd347"
    end
  end
end
