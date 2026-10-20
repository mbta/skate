defmodule Skate.Radio.SQS.Messages.Receiver do
  @moduledoc """
  Stateless receiver for consuming and discarding messages from AWS SQS queues.
  """

  alias Skate.Radio.SQS.Client

  @default_wait_time_seconds 20
  @default_max_number_of_messages 10

  @doc """
  Receives messages from the events queue, emits telemetry events,
  and discards (deletes) each message from the queue.
  """
  @spec receive_and_discard(Keyword.t()) :: {:ok, non_neg_integer()} | {:error, term()}
  def receive_and_discard(options \\ []) do
    queue_url = resolve_queue_url(options)

    case queue_url do
      url when is_binary(url) and url != "" ->
        process_queue_messages(url, options)

      _ ->
        {:error, :queue_not_configured}
    end
  end

  defp resolve_queue_url(options) do
    case Keyword.get(options, :queue_url) do
      url when is_binary(url) and url != "" ->
        url

      _ ->
        client_configuration = Application.get_env(:skate, Client, [])
        Keyword.get(client_configuration, :events_queue_url)
    end
  end

  defp process_queue_messages(queue_url, options) do
    receive_options = [
      wait_time_seconds:
        Keyword.get(options, :wait_time_seconds, @default_wait_time_seconds),
      max_number_of_messages:
        Keyword.get(options, :max_number_of_messages, @default_max_number_of_messages)
    ]

    :telemetry.execute(
      [:skate, :radio, :sqs, :receive, :start],
      %{system_time: System.system_time()},
      %{queue_url: queue_url}
    )

    start_monotonic_time = System.monotonic_time(:microsecond)
    query = ExAws.SQS.receive_message(queue_url, receive_options)
    request_config_overrides = Application.get_env(:ex_aws, :request_config_overrides, %{})

    case ExAws.request(query, request_config_overrides) do
      {:ok, %{body: %{messages: messages}}} ->
        duration_microseconds = System.monotonic_time(:microsecond) - start_monotonic_time
        message_count = length(messages)

        :telemetry.execute(
          [:skate, :radio, :sqs, :receive, :success],
          %{duration_microseconds: duration_microseconds, message_count: message_count},
          %{queue_url: queue_url}
        )

        discard_all_messages(queue_url, messages, request_config_overrides)
        {:ok, message_count}

      {:ok, %{body: _empty_or_other}} ->
        duration_microseconds = System.monotonic_time(:microsecond) - start_monotonic_time

        :telemetry.execute(
          [:skate, :radio, :sqs, :receive, :success],
          %{duration_microseconds: duration_microseconds, message_count: 0},
          %{queue_url: queue_url}
        )

        {:ok, 0}

      {:error, error_reason} ->
        duration_microseconds = System.monotonic_time(:microsecond) - start_monotonic_time

        :telemetry.execute(
          [:skate, :radio, :sqs, :receive, :failure],
          %{duration_microseconds: duration_microseconds},
          %{queue_url: queue_url, error_reason: error_reason}
        )

        {:error, error_reason}
    end
  end

  defp discard_all_messages(queue_url, messages, request_config_overrides) do
    Enum.each(messages, fn message ->
      discard_message(queue_url, message, request_config_overrides)
    end)
  end

  defp discard_message(queue_url, %{receipt_handle: receipt_handle} = message, request_config_overrides) do
    message_id = Map.get(message, :message_id) || ""

    :telemetry.execute(
      [:skate, :radio, :sqs, :discard, :start],
      %{system_time: System.system_time()},
      %{queue_url: queue_url, message_id: message_id}
    )

    start_monotonic_time = System.monotonic_time(:microsecond)
    query = ExAws.SQS.delete_message(queue_url, receipt_handle)

    case ExAws.request(query, request_config_overrides) do
      {:ok, _response} ->
        duration_microseconds = System.monotonic_time(:microsecond) - start_monotonic_time

        :telemetry.execute(
          [:skate, :radio, :sqs, :discard, :success],
          %{duration_microseconds: duration_microseconds},
          %{queue_url: queue_url, message_id: message_id}
        )

        :ok

      {:error, error_reason} ->
        duration_microseconds = System.monotonic_time(:microsecond) - start_monotonic_time

        :telemetry.execute(
          [:skate, :radio, :sqs, :discard, :failure],
          %{duration_microseconds: duration_microseconds},
          %{queue_url: queue_url, message_id: message_id, error_reason: error_reason}
        )

        {:error, error_reason}
    end
  end

  defp discard_message(_queue_url, _message_without_receipt_handle, _overrides), do: :ok
end
