defmodule Notifications.NotificationReason do
  @moduledoc false

  use Ecto.Type

  @type t ::
          :manpower
          | :disabled
          | :diverted
          | :accident
          | :other
          | :adjusted
          | :operator_error
          | :traffic

  @valid_reasons [
    :manpower,
    :disabled,
    :diverted,
    :accident,
    :other,
    :adjusted,
    :operator_error,
    :traffic
  ]

  @impl true
  def type, do: :string

  @impl true
  def cast(reason) do
    if reason in @valid_reasons do
      {:ok, reason}
    else
      :error
    end
  end

  @impl true
  def load(reason) do
    reason_as_atom = String.to_existing_atom(reason)

    if reason_as_atom in @valid_reasons do
      {:ok, reason_as_atom}
    else
      :error
    end
  end

  @impl true
  def dump(reason) do
    if reason in @valid_reasons do
      {:ok, Atom.to_string(reason)}
    else
      :error
    end
  end
end
