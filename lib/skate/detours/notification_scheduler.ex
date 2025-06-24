defmodule Skate.Detours.NotificationScheduler do
  @moduledoc """
  Interface for managing detour expiration notifiactions.
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
        %Detour{status: :active, estimated_duration: estimated_duration} = detour,
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
              estimated_duration: estimated_duration,
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
         %Detour{status: :active, estimated_duration: estimated_duration} = detour,
         expires_at
       ) do
    expired_task =
      DetourExpirationTask.create_changeset(%{
        detour: detour,
        estimated_duration: estimated_duration,
        expires_at: expires_at,
        notification_offset_minutes: 0,
        status: :scheduled
      })

    warning_task =
      DetourExpirationTask.create_changeset(%{
        detour: detour,
        estimated_duration: estimated_duration,
        expires_at: expires_at,
        notification_offset_minutes: 30,
        status: :scheduled
      })

    [expired_task, warning_task]
  end
end
