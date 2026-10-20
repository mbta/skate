defmodule Test.Support.Radio.SQSFixtures do
  @moduledoc """
  Shared SQS XML responses and queue URL fixtures for Radio SQS test suites.
  """

  @commands_queue_url "https://sqs.us-east-1.amazonaws.com/123456789012/commands_queue"
  @events_queue_url "https://sqs.us-east-1.amazonaws.com/123456789012/events_queue"

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

  def commands_queue_url, do: @commands_queue_url
  def events_queue_url, do: @events_queue_url

  def queue_attributes_xml, do: @queue_attributes_xml
  def send_message_xml, do: @send_message_xml
  def receive_messages_xml, do: @receive_messages_xml
  def empty_receive_messages_xml, do: @empty_receive_messages_xml
  def delete_message_xml, do: @delete_message_xml
end
