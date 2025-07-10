defmodule Skate.Detours.FeedSyncrhonizer do
  use GenServer

  @run_time {4, 0, 0}

  def start_link(_) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  @impl true
  def init(state) do
    schedule_next_run()
    {:ok, state}
  end

  @impl true
  def handle_info(:sync_with_swiftly, state) do
    # get skate info
    # get swiftly info
    # diff
    # update as needed

    schedule_next_run()
    {:noreply, state}
  end

  defp schedule_next_run do
    now = Timex.now()
    rune_at = calculate_next_run(now)
    delay = Timex.diff(run_at, now, :milliseconds)

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
