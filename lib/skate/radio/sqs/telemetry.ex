defmodule Skate.Radio.SQS.Telemetry do
  @moduledoc """
  Provides methods for configuring and handling telemetry for Skate Radio SQS operations.
  """

  require Logger

  @default_handler_identifier "skate.radio.sqs"
  @default_handler_configuration []

  @doc """
  Attaches telemetry handlers for Radio SQS connection and publishing events.
  """
  def attach_handler(
        handler_identifier \\ @default_handler_identifier,
        handler_configuration \\ @default_handler_configuration
      ) do
    events = [
      [:skate, :radio, :sqs, :connection, :start],
      [:skate, :radio, :sqs, :connection, :success],
      [:skate, :radio, :sqs, :connection, :failure],
      [:skate, :radio, :sqs, :publish, :start],
      [:skate, :radio, :sqs, :publish, :success],
      [:skate, :radio, :sqs, :publish, :failure],
      [:skate, :radio, :sqs, :receive, :start],
      [:skate, :radio, :sqs, :receive, :success],
      [:skate, :radio, :sqs, :receive, :failure],
      [:skate, :radio, :sqs, :discard, :start],
      [:skate, :radio, :sqs, :discard, :success],
      [:skate, :radio, :sqs, :discard, :failure]
    ]

    :telemetry.attach_many(
      handler_identifier,
      events,
      &handle_event/4,
      handler_configuration
    )
  end

  @doc """
  Detaches telemetry handlers for Radio SQS connection and publishing events.
  """
  def detach_handler(handler_identifier \\ @default_handler_identifier) do
    :telemetry.detach(handler_identifier)
  end

  @doc false
  def handle_event(
        [:skate, :radio, :sqs, :connection, :start],
        _measurements,
        %{queue_type: queue_type, queue_url: queue_url},
        _configuration
      ) do
    Logger.info(
      "Radio SQS connection check started: queue_type=#{queue_type} queue_url=#{queue_url}"
    )
  end

  def handle_event(
        [:skate, :radio, :sqs, :connection, :success],
        %{duration_microseconds: duration_microseconds, attempts: attempts},
        %{queue_type: queue_type},
        _configuration
      ) do
    Logger.info(
      "Radio SQS connection check succeeded: queue_type=#{queue_type} " <>
        "duration_microseconds=#{duration_microseconds} attempts=#{attempts}"
    )
  end

  def handle_event(
        [:skate, :radio, :sqs, :connection, :failure],
        %{attempts: attempts},
        %{queue_type: queue_type, error_reason: error_reason},
        _configuration
      ) do
    Logger.error(
      "Radio SQS connection check failed: queue_type=#{queue_type} " <>
        "attempts=#{attempts} error_reason=#{inspect(error_reason)}"
    )
  end

  def handle_event(
        [:skate, :radio, :sqs, :publish, :start],
        _measurements,
        %{
          queue_url: queue_url,
          message_type: message_type,
          message_identifier: message_identifier
        },
        _configuration
      ) do
    Logger.info(
      "Radio SQS message publish started: message_type=#{message_type} " <>
        "message_identifier=#{message_identifier} queue_url=#{queue_url}"
    )
  end

  def handle_event(
        [:skate, :radio, :sqs, :publish, :success],
        %{duration_microseconds: duration_microseconds},
        %{
          message_type: message_type,
          message_identifier: message_identifier,
          message_id: message_id
        },
        _configuration
      ) do
    Logger.info(
      "Radio SQS message publish succeeded: message_type=#{message_type} " <>
        "message_identifier=#{message_identifier} message_id=#{message_id} " <>
        "duration_microseconds=#{duration_microseconds}"
    )
  end

  def handle_event(
        [:skate, :radio, :sqs, :publish, :failure],
        %{duration_microseconds: duration_microseconds},
        %{
          message_type: message_type,
          message_identifier: message_identifier,
          error_reason: error_reason
        },
        _configuration
      ) do
    Logger.error(
      "Radio SQS message publish failed: message_type=#{message_type} " <>
        "message_identifier=#{message_identifier} duration_microseconds=#{duration_microseconds} " <>
        "error_reason=#{inspect(error_reason)}"
    )
  end

  def handle_event(
        [:skate, :radio, :sqs, :receive, :start],
        _measurements,
        %{queue_url: queue_url},
        _configuration
      ) do
    Logger.info("Radio SQS receive started: queue_url=#{queue_url}")
  end

  def handle_event(
        [:skate, :radio, :sqs, :receive, :success],
        %{duration_microseconds: duration_microseconds, message_count: message_count},
        %{queue_url: queue_url},
        _configuration
      ) do
    Logger.info(
      "Radio SQS receive succeeded: queue_url=#{queue_url} " <>
        "message_count=#{message_count} duration_microseconds=#{duration_microseconds}"
    )
  end

  def handle_event(
        [:skate, :radio, :sqs, :receive, :failure],
        %{duration_microseconds: duration_microseconds},
        %{queue_url: queue_url, error_reason: error_reason},
        _configuration
      ) do
    Logger.error(
      "Radio SQS receive failed: queue_url=#{queue_url} " <>
        "duration_microseconds=#{duration_microseconds} error_reason=#{inspect(error_reason)}"
    )
  end

  def handle_event(
        [:skate, :radio, :sqs, :discard, :start],
        _measurements,
        %{queue_url: queue_url, message_id: message_id},
        _configuration
      ) do
    Logger.info("Radio SQS discard started: message_id=#{message_id} queue_url=#{queue_url}")
  end

  def handle_event(
        [:skate, :radio, :sqs, :discard, :success],
        %{duration_microseconds: duration_microseconds},
        %{queue_url: queue_url, message_id: message_id},
        _configuration
      ) do
    Logger.info(
      "Radio SQS discard succeeded: message_id=#{message_id} queue_url=#{queue_url} " <>
        "duration_microseconds=#{duration_microseconds}"
    )
  end

  def handle_event(
        [:skate, :radio, :sqs, :discard, :failure],
        %{duration_microseconds: duration_microseconds},
        %{queue_url: queue_url, message_id: message_id, error_reason: error_reason},
        _configuration
      ) do
    Logger.error(
      "Radio SQS discard failed: message_id=#{message_id} queue_url=#{queue_url} " <>
        "duration_microseconds=#{duration_microseconds} error_reason=#{inspect(error_reason)}"
    )
  end
end
