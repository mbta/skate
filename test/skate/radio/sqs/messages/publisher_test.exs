defmodule Skate.Radio.SQS.Messages.PublisherTest do
  use ExUnit.Case, async: false
  import Mox
  import Test.Support.Radio.SQSFixtures

  alias Skate.Radio.SQS.Messages.Heartbeat
  alias Skate.Radio.SQS.Messages.Publisher

  setup :set_mox_global
  setup :verify_on_exit!

  describe "publish/2 and publish_heartbeat/1" do
    test "successfully publishes a heartbeat message to SQS" do
      commands_url = commands_queue_url()

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, body, _headers, _opts ->
        assert body =~ "Action=SendMessage"
        assert body =~ "ready"
        {:ok, %{status_code: 200, body: send_message_xml()}}
      end)

      heartbeat =
        Heartbeat.new(
          message_identifier: "msg-1234-uuid",
          status: "ready"
        )

      assert {:ok, response} =
               Publisher.publish(heartbeat, queue_url: commands_url)

      assert response.body.message_id == "5fea7743-dd80-46e3-ac0f-d20f7f7cd347"
    end

    test "publish_heartbeat/1 convenience helper constructs and publishes heartbeat" do
      commands_url = commands_queue_url()

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, body, _headers, _opts ->
        assert body =~ "Action=SendMessage"
        assert body =~ "ready"
        {:ok, %{status_code: 200, body: send_message_xml()}}
      end)

      assert {:ok, response} =
               Publisher.publish_heartbeat(queue_url: commands_url)

      assert response.body.message_id == "5fea7743-dd80-46e3-ac0f-d20f7f7cd347"
    end

    test "returns error on AWS failure" do
      commands_url = commands_queue_url()

      Mox.expect(ExAws.Request.HttpMock, :request, fn :post, _url, _body, _headers, _opts ->
        {:ok, %{status_code: 403, body: "Forbidden"}}
      end)

      heartbeat = Heartbeat.new(message_identifier: "msg-error-uuid")

      assert {:error, {:http_error, 403, "Forbidden"}} =
               Publisher.publish(heartbeat, queue_url: commands_url)
    end

    test "returns error when queue URL is unconfigured" do
      heartbeat = Heartbeat.new()

      assert {:error, :queue_not_configured} =
               Publisher.publish(heartbeat, queue_url: nil)
    end

    test "rejects invalid or malformed messages without calling SQS" do
      invalid_messages = [
        "not a struct",
        %{message_identifier: "not a struct map"},
        %{some: "map"},
        nil
      ]

      for invalid_message <- invalid_messages do
        assert {:error, :invalid_message} =
                 Publisher.publish(invalid_message, queue_url: "https://sqs.amazonaws.com/test")
      end
    end
  end
end
