defmodule Skate.Detours.NotificationScheduler.Worker do
  @moduledoc """
    Processes tasks for NotificationScheduler.Server
  """
  alias Skate.Detours.Db.DetourExpirationTask
  use GenServer

  @doc """
  Start the server and link it
  """
  @default_name __MODULE__
  def start_link(defaults \\ []) do
    name = Keyword.get(defaults, :name, @default_name)
    GenServer.start_link(__MODULE__, defaults, name: name)
  end

  def default_name do
    @default_name
  end

  @impl true
  def handle_cast(
        {:run,
         %DetourExpirationTask{
           detour: detour,
           notification_offset_minutes: offset_minutes
         } = task},
        state
      ) do
    task
    |> DetourExpirationTask.update_changeset(%{status: :executing})
    |> Skate.Repo.update!()

    detour
    |> Notifications.Notification.create_detour_expiration_notification(%{
      expires_in: Duration.new!(minute: offset_minutes),
      estimated_duration: detour.state["context"]["selectedDuration"]
    })
    |> handle_result(task)

    {:noreply, state}
  end

  def handle_result({:ok, _result}, task) do
    task
    |> DetourExpirationTask.update_changeset(%{status: :completed})
    |> Skate.Repo.update!()
  end

  def handle_result({:error, _error}, task) do
    task
    |> DetourExpirationTask.update_changeset(%{status: :retryable})
    |> Skate.Repo.update!()
  end

  @impl true
  def init(opts) do
    {:ok, opts}
  end
end
