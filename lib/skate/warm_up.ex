defmodule Skate.WarmUp do
  use GenServer
  require Logger

  def start_link(_) do
    GenServer.start_link(__MODULE__, :ok)
  end

  @impl true
  def init(_arg) do
    pool_size = Application.get_env(:skate, Skate.Repo)[:pool_size]
    warmup_config = Application.get_env(:skate, Skate.WarmUp)

    minimum_percent_queries_to_succeed = warmup_config[:minimum_percent_queries_to_succeed] || 1
    max_attempts = warmup_config[:max_attempts] || 1
    seconds_between_attempts = warmup_config[:seconds_between_attempts] || 0

    warm_up_check_fn =
      Application.get_env(:skate, :warm_up_test_fn, fn _index, _attemptgit ->
        Skate.Repo.query("SELECT 1", [])
      end)

    case check_connections_warmed_up(%{
           pool_size: pool_size,
           required_success_count: pool_size * minimum_percent_queries_to_succeed,
           max_attempts: max_attempts,
           attempt: 1,
           seconds_between_attempts: seconds_between_attempts,
           check_fn: warm_up_check_fn
         }) do
      %{status: :success} = result ->
        Logger.info(format_result_message(result))
        :ignore

      %{status: :failure} = result ->
        message = format_result_message(result)
        Logger.error(message)
        {:stop, message}
    end
  end

  defp check_connections_warmed_up(
         %{
           pool_size: pool_size,
           required_success_count: required_success_count,
           max_attempts: max_attempts,
           attempt: attempt,
           check_fn: check_fn,
           seconds_between_attempts: seconds_between_attempts
         } = config
       ) do
    count_success =
      Enum.map(0..(pool_size - 1), fn index ->
        Task.async(fn ->
          try do
            check_fn.(index, attempt)
          catch
            e -> {:error, e}
          end
        end)
      end)
      |> Task.await_many()
      |> Enum.count(&(elem(&1, 0) == :ok))

    status = if count_success >= required_success_count, do: :success, else: :failure

    result = %{
      status: status,
      count_success: count_success,
      total_count: pool_size,
      attempt: attempt
    }

    if result.status == :success do
      result
    else
      if max_attempts == attempt do
        result
      else
        Logger.warn(format_result_message(result))
        :timer.sleep(:timer.seconds(seconds_between_attempts))
        check_connections_warmed_up(%{config | attempt: attempt + 1})
      end
    end
  end

  defp format_result_message(%{
         status: status,
         count_success: count_success,
         total_count: total_count,
         attempt: attempt
       }) do
    "#{__MODULE__} Repo warm-up attempt complete. status=#{status} count_query_success=#{count_success} total_query_count=#{total_count} attempt=#{attempt}"
  end
end
