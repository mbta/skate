defmodule Skate.Detours.DirectionName do
  @moduledoc false

  use Ecto.Type

  @type t :: String.t()

  @valid_directions ["Inbound", "Outbound"]

  @impl true
  def type, do: :string

  @impl true
  def cast(direction), do: allow_valid_direction(direction)

  @impl true
  def load(direction), do: allow_valid_direction(direction)

  @impl true
  def dump(direction), do: allow_valid_direction(direction)

  defp allow_valid_direction(direction) do
    if direction in @valid_directions do
      {:ok, direction}
    else
      :error
    end
  end
end
