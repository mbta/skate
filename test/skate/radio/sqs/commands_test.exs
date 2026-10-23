defmodule Skate.Radio.SQS.CommandsTest do
  use ExUnit.Case, async: false

  import Test.Support.Helpers

  alias Skate.Radio.SQS.Commands
  alias Skate.Radio.SQS.Constants

  @fake_valid_command %{name: :noop, data: nil}

  @fake_queue_url "https://sqs.us-east-2.amazonaws.com/123456789012/FakeCommandsQueue"

  @fake_send_message_response_xml """
  <SendMessageResponse xmlns="http://amazonaws.com">
    <SendMessageResult>
      <MD5OfMessageBody>341987514a6011409f984a919013c733</MD5OfMessageBody>
      <MessageId>12345678-1234-1234-1234-123456789012</MessageId>
    </SendMessageResult>
    <ResponseMetadata>
      <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
    </ResponseMetadata>
  </SendMessageResponse>
  """

  @fake_transient_error_response_xml """
  <ErrorResponse xmlns="http://amazonaws.com">
    <Error>
      <Type>Sender</Type>
      <Code>RequestThrottled</Code>
      <Message>The request was throttled due to limit exceedance.</Message>
      <Detail/>
    </Error>
    <RequestId>00000000-0000-0000-0000-000000000000</RequestId>
  </ErrorResponse>
  """

  @fake_send_message_response {
    :ok,
    %{
      status_code: 200,
      body: @fake_send_message_response_xml
    }
  }

  @fake_transient_error_response {
    :ok,
    %{
      status_code: 400,
      body: @fake_transient_error_response_xml
    }
  }

  setup do
    reassign_env(
      :skate,
      Skate.Radio.SQS.Config,
      for queue_name <- Constants.queue_names(), into: [] do
        {:"#{queue_name}_queue_url", @fake_queue_url}
      end
    )

    case start_supervised(Commands) do
      {:ok, pid} ->
        {:ok, %{pid: pid}}

      {:error, error} ->
        raise inspect(error)
    end
  end

  describe "handle_call/3" do
    for {scenario, input, stub, expected} <- [
          {
            "sending a noop command",
            @fake_valid_command,
            @fake_send_message_response,
            :ok
          },
          {
            "transient error",
            @fake_valid_command,
            @fake_transient_error_response,
            :error
          }
        ] do
      test "returns #{expected} when #{scenario}", %{pid: pid} do
        Mox.stub(
          ExAws.Request.HttpMock,
          :request,
          fn _, _, _, _, _ -> unquote(Macro.escape(stub)) end
        )

        Mox.allow(ExAws.Request.HttpMock, self(), pid)

        assert unquote(expected) =
                 GenServer.call(pid, {:send, unquote(Macro.escape(input))})
      end
    end
  end
end
