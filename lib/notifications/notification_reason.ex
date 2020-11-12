defmodule Notifications.NotificationReason do
  use Ecto.Type

  @type t :: :manpower | :disabled | :diverted | :accident

  @impl true
  def type, do: :string

  @impl true
  def cast(:manpower), do: {:ok, :manpower}
  def cast(:disabled), do: {:ok, :disabled}
  def cast(:diverted), do: {:ok, :diverted}
  def cast(:accident), do: {:ok, :accident}
  def cast(_), do: :error

  @impl true
  def load("manpower"), do: {:ok, :manpower}
  def load("disabled"), do: {:ok, :disabled}
  def load("diverted"), do: {:ok, :diverted}
  def load("accident"), do: {:ok, :accident}
  def load(_), do: :error

  @impl true
  def dump(:manpower), do: {:ok, "manpower"}
  def dump(:disabled), do: {:ok, "disabled"}
  def dump(:diverted), do: {:ok, "diverted"}
  def dump(:accident), do: {:ok, "accident"}
end
