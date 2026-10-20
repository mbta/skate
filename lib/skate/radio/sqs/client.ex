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

  defmodule Telemetry do
    @moduledoc """
    Provides methods for configuring and handling telemetry for Skate.Radio.SQS.Client.
    """

    require Logger

    @default_handler_identifier "skate.radio.sqs.client"
    @default_handler_configuration []

    @doc """
    Attaches telemetry handlers for Radio SQS connection events.
    """
    def attach_handler(
          handler_identifier \\ @default_handler_identifier,
          handler_configuration \\ @default_handler_configuration
        ) do
      events = [
        [:skate, :radio, :sqs, :connection, :start],
        [:skate, :radio, :sqs, :connection, :success],
        [:skate, :radio, :sqs, :connection, :failure]
      ]

      :telemetry.attach_many(
        handler_identifier,
        events,
        &handle_event/4,
        handler_configuration
      )
    end

    @doc """
    Detaches telemetry handlers for Radio SQS connection events.
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
      request_function: Keyword.get(options, :request_function, &ExAws.request/1),
      sleep_function: Keyword.get(options, :sleep_function, &:timer.sleep/1),
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

    {:noreply, %{state | connection_status: updated_status}}
  end

  @impl true
  def handle_call(:get_connection_status, _from, state) do
    {:reply, state.connection_status, state}
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

    case state.request_function.(query) do
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

          state.sleep_function.(delay_milliseconds)

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
end
