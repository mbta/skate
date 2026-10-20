defmodule Skate.Radio.SQS.ReceiverTest do
  use ExUnit.Case, async: false
  import Mox
  import Test.Support.Radio.SQSFixtures

  alias Skate.Radio.SQS.Receiver

  setup :set_mox_global
  setup :verify_on_exit!

  describe "receive_and_discard/1" do
    test "receives messages from events queue and deletes each message" do
      events_url = events_queue_url()

      # 1 ReceiveMessage call
      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, body, _headers, _opts ->
        assert body =~ "Action=ReceiveMessage"
        assert body =~ "WaitTimeSeconds=20"
        assert body =~ "MaxNumberOfMessages=10"
        {:ok, %{status_code: 200, body: receive_messages_xml()}}
      end)

      # 2 DeleteMessage calls (one for each message in the batch)
      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, body, _headers, _opts ->
        assert body =~ "Action=DeleteMessage"
        assert body =~ "ReceiptHandle=receipt-handle-token-001"
        {:ok, %{status_code: 200, body: delete_message_xml()}}
      end)

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, body, _headers, _opts ->
        assert body =~ "Action=DeleteMessage"
        assert body =~ "ReceiptHandle=receipt-handle-token-002"
        {:ok, %{status_code: 200, body: delete_message_xml()}}
      end)

      assert {:ok, 2} =
               Receiver.receive_and_discard(queue_url: events_url)
    end

    test "handles empty queue responses gracefully" do
      events_url = events_queue_url()

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, body, _headers, _opts ->
        assert body =~ "Action=ReceiveMessage"
        {:ok, %{status_code: 200, body: empty_receive_messages_xml()}}
      end)

      assert {:ok, 0} =
               Receiver.receive_and_discard(queue_url: events_url)
    end

    test "returns error when receive_message fails" do
      events_url = events_queue_url()

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 403, body: "Forbidden"}}
      end)

      assert {:error, {:http_error, 403, "Forbidden"}} =
               Receiver.receive_and_discard(queue_url: events_url)
    end

    test "continues processing batch even when a delete_message fails" do
      events_url = events_queue_url()

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 200, body: receive_messages_xml()}}
      end)

      # First delete fails
      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 403, body: "Forbidden"}}
      end)

      # Second delete succeeds
      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 200, body: delete_message_xml()}}
      end)

      assert {:ok, 2} =
               Receiver.receive_and_discard(queue_url: events_url)
    end

    test "returns error when queue URL is unconfigured" do
      assert {:error, :queue_not_configured} =
               Receiver.receive_and_discard(queue_url: nil)
    end
  end
end
