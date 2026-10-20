defmodule Skate.Radio.SQS.Client do
  @moduledoc """
  Manages AWS SQS client configuration, startup connection verification,
  and connection telemetry for the Radio integration.
  """

  use GenServer
  require Logger

  @default_name __MODULE__
  @default_initial_delay_milliseconds 1_000
  @default_maximum_delay_milliseconds 30_000
  @default_maximum_attempts 5
  @default_heartbeat_interval_milliseconds 300_000

  alias Skate.Radio.SQS.Messages.Heartbeat

  defmodule Telemetry do
    @moduledoc """
    Provides methods for configuring and handling telemetry for Skate.Radio.SQS.Client.
    """

    require Logger

    @default_handler_identifier "skate.radio.sqs.client"
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
        [:skate, :radio, :sqs, :publish, :failure]
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
  end

  # Client API

  def start_link(options \\ []) do
    merged_options =
      Keyword.merge(
        Application.get_env(:skate, __MODULE__, []),
        options
      )

    if Keyword.get(merged_options, :enabled?, false) do
      server_name = Keyword.get(merged_options, :name, @default_name)
      GenServer.start_link(__MODULE__, merged_options, name: server_name)
    else
      :ignore
    end
  end

  @doc """
  Returns the current connection status map for configured queues.
  """
  def get_connection_status(server \\ @default_name) do
    GenServer.call(server, :get_connection_status)
  end

  @doc """
  Publishes a message to a configured SQS queue and emits publish telemetry events.
  """
  def publish_message(message, options \\ []) do
    server = Keyword.get(options, :server, @default_name)
    GenServer.call(server, {:publish_message, message, options})
  end

  @doc """
  Constructs and publishes a Heartbeat message to the commands queue.
  """
  def publish_heartbeat(options \\ []) do
    heartbeat_message = Heartbeat.new(options)
    publish_message(heartbeat_message, options)
  end

  # GenServer Callbacks

  @impl true
  def init(options) do
    initial_state = %{
      commands_queue_url: Keyword.get(options, :commands_queue_url),
      events_queue_url: Keyword.get(options, :events_queue_url),
      initial_delay_milliseconds:
        Keyword.get(options, :initial_delay_milliseconds, @default_initial_delay_milliseconds),
      maximum_delay_milliseconds:
        Keyword.get(options, :maximum_delay_milliseconds, @default_maximum_delay_milliseconds),
      maximum_attempts: Keyword.get(options, :maximum_attempts, @default_maximum_attempts),
      heartbeat_interval_milliseconds:
        Keyword.get(
          options,
          :heartbeat_interval_milliseconds,
          @default_heartbeat_interval_milliseconds
        ),
      connection_status: %{
        commands_queue: :pending,
        events_queue: :pending
      }
    }

    {:ok, initial_state, {:continue, :verify_connections}}
  end

  @impl true
  def handle_continue(:verify_connections, state) do
    commands_status =
      if is_binary(state.commands_queue_url) and state.commands_queue_url != "" do
        verify_queue_connection(:commands, state.commands_queue_url, state)
      else
        :not_configured
      end

    events_status =
      if is_binary(state.events_queue_url) and state.events_queue_url != "" do
        verify_queue_connection(:events, state.events_queue_url, state)
      else
        :not_configured
      end

    updated_status = %{
      commands_queue: commands_status,
      events_queue: events_status
    }

    maybe_schedule_heartbeat(commands_status, state)

    {:noreply, %{state | connection_status: updated_status}}
  end

  @impl true
  def handle_call(:get_connection_status, _from, state) do
    {:reply, state.connection_status, state}
  end

  def handle_call({:publish_message, message, options}, _from, state) do
    queue_type = Keyword.get(options, :queue_type, :commands)

    queue_url =
      case queue_type do
        :commands -> state.commands_queue_url
        :events -> state.events_queue_url
      end

    result = send_sqs_message(queue_url, message)
    {:reply, result, state}
  end

  @impl true
  def handle_info(:publish_heartbeat, state) do
    if state.connection_status.commands_queue == :connected do
      heartbeat_message = Heartbeat.new()
      send_sqs_message(state.commands_queue_url, heartbeat_message)
    end

    schedule_heartbeat(state.heartbeat_interval_milliseconds)
    {:noreply, state}
  end

  # Verification with Exponential Backoff

  defp verify_queue_connection(queue_type, queue_url, state) do
    :telemetry.execute(
      [:skate, :radio, :sqs, :connection, :start],
      %{system_time: System.system_time()},
      %{queue_type: queue_type, queue_url: queue_url}
    )

    start_monotonic_time = System.monotonic_time(:microsecond)
    attempt_queue_connection(queue_type, queue_url, 1, start_monotonic_time, state)
  end

  defp attempt_queue_connection(
         queue_type,
         queue_url,
         attempt_number,
         start_monotonic_time,
         state
       ) do
    query = ExAws.SQS.get_queue_attributes(queue_url, [:queue_arn])
    request_config_overrides = Application.get_env(:ex_aws, :request_config_overrides, %{})

    case ExAws.request(query, request_config_overrides) do
      {:ok, attributes} ->
        duration_microseconds = System.monotonic_time(:microsecond) - start_monotonic_time

        :telemetry.execute(
          [:skate, :radio, :sqs, :connection, :success],
          %{duration_microseconds: duration_microseconds, attempts: attempt_number},
          %{queue_type: queue_type, queue_url: queue_url, attributes: attributes}
        )

        :connected

      {:error, error_reason} ->
        if attempt_number < state.maximum_attempts do
          delay_milliseconds =
            calculate_backoff_delay_milliseconds(
              attempt_number,
              state.initial_delay_milliseconds,
              state.maximum_delay_milliseconds
            )

          :timer.sleep(delay_milliseconds)

          attempt_queue_connection(
            queue_type,
            queue_url,
            attempt_number + 1,
            start_monotonic_time,
            state
          )
        else
          duration_microseconds = System.monotonic_time(:microsecond) - start_monotonic_time

          :telemetry.execute(
            [:skate, :radio, :sqs, :connection, :failure],
            %{duration_microseconds: duration_microseconds, attempts: attempt_number},
            %{queue_type: queue_type, queue_url: queue_url, error_reason: error_reason}
          )

          :failed
        end
    end
  end

  defp calculate_backoff_delay_milliseconds(
         attempt_number,
         initial_delay_milliseconds,
         maximum_delay_milliseconds
       ) do
    exponential_factor = :math.pow(2, attempt_number - 1)
    calculated_delay = trunc(initial_delay_milliseconds * exponential_factor)
    min(calculated_delay, maximum_delay_milliseconds)
  end

  # Message Publishing

  defp send_sqs_message(queue_url, message) do
    if is_binary(queue_url) and queue_url != "" do
      encoded_body = Jason.encode!(message)
      message_identifier = resolve_message_identifier(message)
      message_type = resolve_message_type(message)

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
    else
      {:error, :queue_not_configured}
    end
  end

  defp resolve_message_identifier(%{message_identifier: message_identifier}),
    do: message_identifier

  defp resolve_message_identifier(%{"message_identifier" => message_identifier}),
    do: message_identifier

  defp resolve_message_identifier(_), do: "unknown"

  defp resolve_message_type(%struct_module{}) do
    struct_module
    |> Module.split()
    |> List.last()
  end

  defp resolve_message_type(message) when is_map(message) do
    Map.get(message, :type) || Map.get(message, "type") || "map"
  end

  defp resolve_message_type(_), do: "unknown"

  defp maybe_schedule_heartbeat(:connected, state) do
    schedule_heartbeat(state.heartbeat_interval_milliseconds)
  end

  defp maybe_schedule_heartbeat(_not_connected, _state), do: :ok

  defp schedule_heartbeat(interval_milliseconds)
       when is_integer(interval_milliseconds) and interval_milliseconds > 0 do
    Process.send_after(self(), :publish_heartbeat, interval_milliseconds)
  end

  defp schedule_heartbeat(_disabled), do: :ok
end
