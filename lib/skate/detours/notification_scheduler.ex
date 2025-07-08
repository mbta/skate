defmodule Skate.Detours.NotificationScheduler do
  @moduledoc """
  Interface for managing scheduled detour notifications.
  """

  alias Skate.Detours.Db.{Detour, DetourExpirationTask}
  require Logger
  import Ecto.Query

  def detour_activated(
        %Detour{status: :active} = detour,
        expires_at
      ) do
    [expired_task, warning_task] = generate_changesets(detour, expires_at)

    Skate.Repo.transaction(fn ->
      [Skate.Repo.insert!(expired_task), Skate.Repo.insert!(warning_task)]
    end)
  end

  def detour_activated(_, _), do: :error

  def detour_deactivated(%Detour{status: :past} = detour) do
    Skate.Repo.delete_all(from d in DetourExpirationTask, where: d.detour_id == ^detour.id)
  end

  def detour_deactivated(_), do: :error

  def detour_duration_changed(
        %Detour{status: :active} = detour,
        expires_at
      ) do
    changesets =
      case Skate.Repo.all(from d in DetourExpirationTask, where: d.detour_id == ^detour.id) do
        [] ->
          generate_changesets(detour, expires_at)

        detour_expiration_tasks ->
          Enum.map(detour_expiration_tasks, fn det ->
            DetourExpirationTask.update_changeset(det, %{
              detour: detour,
              expires_at: expires_at,
              status: :scheduled
            })
          end)
      end

    Skate.Repo.transaction(fn ->
      Enum.map(changesets, &Skate.Repo.insert_or_update!/1)
    end)
  end

  def detour_duration_changed(_, _), do: :error

  defp generate_changesets(
         %Detour{status: :active} = detour,
         expires_at
       ) do
    expired_task =
      DetourExpirationTask.create_changeset(%{
        detour: detour,
        expires_at: expires_at,
        notification_offset_minutes: 0,
        status: :scheduled
      })

    warning_task =
      DetourExpirationTask.create_changeset(%{
        detour: detour,
        expires_at: expires_at,
        notification_offset_minutes: 30,
        status: :scheduled
      })

    [expired_task, warning_task]
  end

  def tasks_ready_to_run do
    Skate.Repo.all(
      from(t in DetourExpirationTask,
        where:
          (t.status in [:scheduled] and
             (t.expires_at <= from_now(30, "minute") and
                t.notification_offset_minutes == 30)) or
            (t.status in [:scheduled] and
               (t.expires_at <= from_now(0, "minute") and
                  t.notification_offset_minutes == 0)),
        preload: [:detour]
      )
    )
  end

  def create_detour_expiration_notification_from_task(
        %DetourExpirationTask{
          detour: %Detour{} = detour,
          notification_offset_minutes: offset_minutes
        } = task
      ) do
    notification_offset = Duration.new!(minute: -offset_minutes)

    created_at_notification_offset =
      task.expires_at |> DateTime.shift(notification_offset) |> DateTime.to_unix()

    Notifications.Notification.create_detour_expiration_notification(detour, %{
      expires_in: Duration.new!(minute: offset_minutes),
      estimated_duration: detour.state["context"]["selectedDuration"],
      notification: %{created_at: created_at_notification_offset}
    })
  end
end
