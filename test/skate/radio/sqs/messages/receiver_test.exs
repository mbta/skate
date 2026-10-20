defmodule Skate.Radio.SQS.Messages.ReceiverTest do
  use ExUnit.Case, async: false
  import Mox

  alias Skate.Radio.SQS.Messages.Receiver

  @receive_messages_xml """
  <ReceiveMessageResponse>
    <ReceiveMessageResult>
      <Message>
        <MessageId>msg-event-001</MessageId>
        <ReceiptHandle>receipt-handle-token-001</ReceiptHandle>
        <MD5OfBody>fafb00f573234a64021191f8011367c3</MD5OfBody>
        <Body>{"event":"test_event","data":123}</Body>
      </Message>
      <Message>
        <MessageId>msg-event-002</MessageId>
        <ReceiptHandle>receipt-handle-token-002</ReceiptHandle>
        <MD5OfBody>fafb00f573234a64021191f8011367c3</MD5OfBody>
        <Body>{"event":"another_event","data":456}</Body>
      </Message>
    </ReceiveMessageResult>
    <ResponseMetadata>
      <RequestId>99daac76-34dd-4714-af61-ff7997666ba6</RequestId>
    </ResponseMetadata>
  </ReceiveMessageResponse>
  """

  @empty_receive_messages_xml """
  <ReceiveMessageResponse>
    <ReceiveMessageResult/>
    <ResponseMetadata>
      <RequestId>88daac76-34dd-4714-af61-ff7997666ba6</RequestId>
    </ResponseMetadata>
  </ReceiveMessageResponse>
  """

  @delete_message_xml """
  <DeleteMessageResponse>
    <ResponseMetadata>
      <RequestId>77daac76-34dd-4714-af61-ff7997666ba6</RequestId>
    </ResponseMetadata>
  </DeleteMessageResponse>
  """

  @telemetry_events [
    [:skate, :radio, :sqs, :receive, :start],
    [:skate, :radio, :sqs, :receive, :success],
    [:skate, :radio, :sqs, :receive, :failure],
    [:skate, :radio, :sqs, :discard, :start],
    [:skate, :radio, :sqs, :discard, :success],
    [:skate, :radio, :sqs, :discard, :failure]
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

  describe "receive_and_discard/1" do
    test "receives messages from events queue and deletes each message, emitting telemetry" do
      events_queue_url = "https://sqs.us-east-1.amazonaws.com/123456789012/events_queue"

      # 1 ReceiveMessage call
      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, body, _headers, _opts ->
        assert body =~ "Action=ReceiveMessage"
        assert body =~ "WaitTimeSeconds=20"
        assert body =~ "MaxNumberOfMessages=10"
        {:ok, %{status_code: 200, body: @receive_messages_xml}}
      end)

      # 2 DeleteMessage calls (one for each message in the batch)
      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, body, _headers, _opts ->
        assert body =~ "Action=DeleteMessage"
        assert body =~ "ReceiptHandle=receipt-handle-token-001"
        {:ok, %{status_code: 200, body: @delete_message_xml}}
      end)

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, body, _headers, _opts ->
        assert body =~ "Action=DeleteMessage"
        assert body =~ "ReceiptHandle=receipt-handle-token-002"
        {:ok, %{status_code: 200, body: @delete_message_xml}}
      end)

      assert {:ok, 2} =
               Receiver.receive_and_discard(queue_url: events_queue_url)

      assert_receive {[:skate, :radio, :sqs, :receive, :start], _reference, _measurements,
                      %{queue_url: ^events_queue_url}}

      assert_receive {[:skate, :radio, :sqs, :receive, :success], _reference,
                      %{duration_microseconds: _, message_count: 2},
                      %{queue_url: ^events_queue_url}}

      assert_receive {[:skate, :radio, :sqs, :discard, :start], _reference, _measurements,
                      %{queue_url: ^events_queue_url, message_id: "msg-event-001"}}

      assert_receive {[:skate, :radio, :sqs, :discard, :success], _reference,
                      %{duration_microseconds: _},
                      %{queue_url: ^events_queue_url, message_id: "msg-event-001"}}

      assert_receive {[:skate, :radio, :sqs, :discard, :start], _reference, _measurements,
                      %{queue_url: ^events_queue_url, message_id: "msg-event-002"}}

      assert_receive {[:skate, :radio, :sqs, :discard, :success], _reference,
                      %{duration_microseconds: _},
                      %{queue_url: ^events_queue_url, message_id: "msg-event-002"}}
    end

    test "handles empty queue responses gracefully" do
      events_queue_url = "https://sqs.us-east-1.amazonaws.com/123456789012/events_queue"

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, body, _headers, _opts ->
        assert body =~ "Action=ReceiveMessage"
        {:ok, %{status_code: 200, body: @empty_receive_messages_xml}}
      end)

      assert {:ok, 0} =
               Receiver.receive_and_discard(queue_url: events_queue_url)

      assert_receive {[:skate, :radio, :sqs, :receive, :success], _reference,
                      %{duration_microseconds: _, message_count: 0},
                      %{queue_url: ^events_queue_url}}

      refute_receive {[:skate, :radio, :sqs, :discard, :start], _, _, _}
    end

    test "emits failure telemetry when receive_message fails" do
      events_queue_url = "https://sqs.us-east-1.amazonaws.com/123456789012/events_queue"

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 403, body: "Forbidden"}}
      end)

      assert {:error, {:http_error, 403, "Forbidden"}} =
               Receiver.receive_and_discard(queue_url: events_queue_url)

      assert_receive {[:skate, :radio, :sqs, :receive, :failure], _reference,
                      %{duration_microseconds: _},
                      %{
                        queue_url: ^events_queue_url,
                        error_reason: {:http_error, 403, "Forbidden"}
                      }}
    end

    test "emits failure telemetry when delete_message fails" do
      events_queue_url = "https://sqs.us-east-1.amazonaws.com/123456789012/events_queue"

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 200, body: @receive_messages_xml}}
      end)

      # First delete fails
      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 403, body: "Forbidden"}}
      end)

      # Second delete succeeds
      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 200, body: @delete_message_xml}}
      end)

      assert {:ok, 2} =
               Receiver.receive_and_discard(queue_url: events_queue_url)

      assert_receive {[:skate, :radio, :sqs, :discard, :failure], _reference,
                      %{duration_microseconds: _},
                      %{
                        queue_url: ^events_queue_url,
                        message_id: "msg-event-001",
                        error_reason: {:http_error, 403, "Forbidden"}
                      }}

      assert_receive {[:skate, :radio, :sqs, :discard, :success], _reference,
                      %{duration_microseconds: _},
                      %{queue_url: ^events_queue_url, message_id: "msg-event-002"}}
    end

    test "returns error when queue URL is unconfigured" do
      assert {:error, :queue_not_configured} =
               Receiver.receive_and_discard(queue_url: nil)

      refute_receive {[:skate, :radio, :sqs, :receive, :start], _, _, _}
    end
  end
end
