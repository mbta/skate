defmodule Skate.Detours.NotificationScheduler.Server do
  @moduledoc """
    Checks for tasks ready to be run
    Sends a message to NotificationScheduler.Worker for each ready task
  """
  alias Skate.Detours.NotificationScheduler
  alias Skate.Detours.NotificationScheduler.Worker
  alias Skate.Detours.Db.DetourExpirationTask
  use GenServer

  @poll_ms 60 * 1000
  def poll_ms do
    @poll_ms
  end

  @default_name __MODULE__
  def default_name do
    @default_name
  end

  @doc """
  Start the server and link it
  """
  def start_link(defaults) do
    name = Keyword.get(defaults, :name, @default_name)
    GenServer.start_link(__MODULE__, defaults, name: name)
  end

  def do_check_for_tasks(state) do
    tasks = NotificationScheduler.tasks_ready_to_run()

    for task <- tasks do
      task
      |> DetourExpirationTask.update_changeset(%{status: :available})
      |> Skate.Repo.update!()

      GenServer.cast(Worker.default_name(), {:run, task})
    end

    schedule_poll(state[:poll_ms])
    {:noreply, state}
  end

  @impl true
  def handle_info(:poll, state) do
    do_check_for_tasks(state)
  end

  def schedule_poll(poll_ms) do
    Process.send_after(self(), :poll, poll_ms)
  end

  @impl true
  def init(opts) do
    schedule_poll(opts[:poll_ms])
    {:ok, opts}
  end
end
