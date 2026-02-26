defmodule Skate.Notifications.Detour do
  @moduledoc """
  Context for working with Detour notifications
  """
  alias Skate.Notifications

  @doc """
  Creates a detour notification struct from a detour to insert into the database
  """
  def detour_notification(%Skate.Detours.Db.Detour{} = detour) do
    %Notifications.Db.Detour{
      detour: detour
    }
  end

  @doc """
  Creates a activated detour notification struct to insert into the database
  """
  def activated_detour(%Skate.Detours.Db.Detour{} = detour) do
    %{
      detour_notification(detour)
      | status: :activated
    }
  end

  @doc """
  Creates an activated detour notification struct to insert into the database
  """
  def deactivated_detour(%Skate.Detours.Db.Detour{} = detour) do
    %{
      detour_notification(detour)
      | status: :deactivated
    }
  end

  @doc """
  Creates an updated detour notification struct to insert into the database
  """
  def updated_detour(%Skate.Detours.Db.Detour{} = detour) do
    %{
      detour_notification(detour)
      | status: :updated
    }
  end
end
