defmodule Skate.Detours.NotificationScheduler do
  @moduledoc """
  Interface for managing detour expiration notifiactions.
  """

  alias Skate.Detours.Db.{Detour, DetourExpirationTask}
  require Logger

  def detour_activated(
        %Detour{status: :active, estimated_duration: estimated_duration} = detour,
        expires_at
      ) do
    %{detour: detour, estimated_duration: estimated_duration, expires_at: expires_at}
    |> DetourExpirationTask.create_changeset()
    |> Skate.Repo.insert()
  end

  def detour_activated(_, _), do: :error

  def detour_deactivated(%Detour{status: :past} = detour) do
    DetourExpirationTask
    |> Skate.Repo.get_by!(detour_id: detour.id)
    |> Skate.Repo.delete()
  end

  def detour_deactivated(_), do: :error

  def detour_duration_changed(
        %Detour{status: :active, estimated_duration: estimated_duration} = detour,
        expires_at
      ) do
    DetourExpirationTask
    |> Skate.Repo.get_by(detour_id: detour.id)
    |> DetourExpirationTask.update_changeset(%{
      detour: detour,
      estimated_duration: estimated_duration,
      expires_at: expires_at
    })
    |> Skate.Repo.insert_or_update()
  end

  def detour_duration_changed(_, _), do: :error
end
