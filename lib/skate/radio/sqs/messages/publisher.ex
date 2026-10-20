defmodule Skate.Radio.SQS.Messages.Publisher do
  @moduledoc """
  Stateless publisher for sending radio messages to AWS SQS queues.
  """

  alias Skate.Radio.SQS.Client
  alias Skate.Radio.SQS.Messages.Heartbeat

  @doc """
  Publishes a message to the specified or default SQS queue.
  Requires the message to be a struct with a binary `message_identifier`.
  """
  @spec publish(struct(), Keyword.t()) :: {:ok, map()} | {:error, term()}
  def publish(message, options \\ [])

  def publish(%struct_module{message_identifier: identifier} = message, options)
      when is_binary(identifier) and identifier != "" do
    queue_url = resolve_queue_url(options)

    case queue_url do
      url when is_binary(url) and url != "" ->
        message_type =
          Keyword.get_lazy(options, :message_type, fn ->
            struct_module |> Module.split() |> List.last()
          end)

        deliver_message(url, message, message_type, identifier)

      _ ->
        {:error, :queue_not_configured}
    end
  end

  def publish(_invalid_message, _options) do
    {:error, :invalid_message}
  end

  @doc """
  Constructs and publishes a Heartbeat message to the commands queue.
  """
  @spec publish_heartbeat(Keyword.t()) :: {:ok, map()} | {:error, term()}
  def publish_heartbeat(options \\ []) do
    heartbeat = Heartbeat.new(options)
    publish(heartbeat, options)
  end

  defp resolve_queue_url(options) do
    case Keyword.get(options, :queue_url) do
      url when is_binary(url) and url != "" ->
        url

      _ ->
        client_configuration = Application.get_env(:skate, Client, [])

        case Keyword.get(options, :queue_type, :commands) do
          :commands -> Keyword.get(client_configuration, :commands_queue_url)
          :events -> Keyword.get(client_configuration, :events_queue_url)
          _ -> nil
        end
    end
  end

  defp deliver_message(queue_url, message, message_type, message_identifier) do
    :telemetry.execute(
      [:skate, :radio, :sqs, :publish, :start],
      %{system_time: System.system_time()},
      %{
        queue_url: queue_url,
        message_type: message_type,
        message_identifier: message_identifier
      }
    )

    start_monotonic_time = System.monotonic_time(:microsecond)
    encoded_body = Jason.encode!(message)
    query = ExAws.SQS.send_message(queue_url, encoded_body)
    request_config_overrides = Application.get_env(:ex_aws, :request_config_overrides, %{})

    case ExAws.request(query, request_config_overrides) do
      {:ok, response} ->
        duration_microseconds = System.monotonic_time(:microsecond) - start_monotonic_time

        message_id =
          get_in(response, [:body, :message_id]) || Map.get(response, :message_id) || ""

        :telemetry.execute(
          [:skate, :radio, :sqs, :publish, :success],
          %{duration_microseconds: duration_microseconds},
          %{
            queue_url: queue_url,
            message_type: message_type,
            message_identifier: message_identifier,
            message_id: message_id
          }
        )

        {:ok, response}

      {:error, error_reason} ->
        duration_microseconds = System.monotonic_time(:microsecond) - start_monotonic_time

        :telemetry.execute(
          [:skate, :radio, :sqs, :publish, :failure],
          %{duration_microseconds: duration_microseconds},
          %{
            queue_url: queue_url,
            message_type: message_type,
            message_identifier: message_identifier,
            error_reason: error_reason
          }
        )

        {:error, error_reason}
    end
  end
end
