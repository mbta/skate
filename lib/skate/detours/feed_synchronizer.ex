defmodule Skate.Detours.FeedSynchronizer do
  @moduledoc """
  GenServer that runs based on the @run_time value {hour, minute, second} once a day
  to sync detours between skate and swiftly considering skate to be the source of truth.
  """

  use GenServer
  require Logger
  alias Skate.Detours.Detours

  @run_time {4, 0, 0}

  def start_link(_) do
    name = {:global, __MODULE__}

    case GenServer.whereis(name) do
      nil -> Singleton.start_child(Skate.Singleton, __MODULE__, [1], {__MODULE__, 1})
      _ -> :ignore
    end
  end

  @impl true
  def init(state) do
    schedule_next_run()
    {:ok, state}
  end

  @impl true
  def handle_info(:sync_with_swiftly, state) do
    Logger.info("Begin sync swiftly detours.")

    Detours.sync_swiftly_with_skate()

    Logger.info("Completed syncing swiftly detours.")

    schedule_next_run()
    {:noreply, state}
  end

  defp schedule_next_run do
    now = Timex.now()
    run_at = calculate_next_run(now)
    delay = Timex.diff(run_at, now, :milliseconds)

    Logger.info(
      "#{__MODULE__} pid=#{inspect(self())} scheduling next detour feed sync at #{run_at}"
    )

    Process.send_after(self(), :sync_with_swiftly, delay)
  end

  defp calculate_next_run(now) do
    {hour, minute, second} = @run_time
    run_at = Timex.set(now, hour: hour, minute: minute, second: second)

    if Timex.before?(now, run_at) do
      run_at
    else
      Timex.shift(run_at, days: 1)
    end
  end
end
