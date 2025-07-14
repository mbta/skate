defmodule Skate.Detours.NotificationScheduler.Server do
  @moduledoc """
    Checks for tasks ready to run and creates notifications
  """
  alias Skate.Detours.NotificationScheduler
  alias Skate.Detours.Db.DetourExpirationTask
  use GenServer

  require Logger

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

  @impl true
  def handle_info(:poll, state) do
    do_check_for_tasks(state)
  end

  def do_check_for_tasks(state) do
    tasks = NotificationScheduler.tasks_ready_to_run()

    for task <- tasks do
      handle_task({:run, task})
    end

    schedule_poll(state[:poll_ms])
    {:noreply, state}
  end

  def schedule_poll(poll_ms) do
    Process.send_after(self(), :poll, poll_ms)
  end

  def handle_task({:run, %DetourExpirationTask{} = task}) do
    task
    |> DetourExpirationTask.update_changeset(%{status: :executing})
    |> Skate.Repo.update!()

    task
    |> Skate.Detours.NotificationScheduler.create_detour_expiration_notification_from_task()
    |> handle_result(task)
  end

  def handle_result({:ok, _result}, task) do
    task
    |> DetourExpirationTask.update_changeset(%{status: :completed})
    |> Skate.Repo.update!()
  end

  def handle_result({:error, error}, task) do
    Logger.error("unknown error=#{inspect(error)} detour=#{inspect(task.detour.id)}")

    task
    |> DetourExpirationTask.update_changeset(%{status: :retryable})
    |> Skate.Repo.update!()
  end

  @impl true
  def init(opts) do
    schedule_poll(opts[:poll_ms])
    {:ok, opts}
  end
end
