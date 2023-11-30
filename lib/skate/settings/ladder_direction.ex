defmodule Skate.Settings.LadderDirection do
  use Ecto.Type

  @type t :: 0 | 1

  @impl true
  def type, do: :integer

  @impl true
  def cast(direction), do: allow_valid_direction(direction)

  @impl true
  def load(direction), do: allow_valid_direction(direction)

  @impl true
  def dump(direction), do: allow_valid_direction(direction)

  defp allow_valid_direction(direction) do
    if direction == 0 || direction == 1 do
      {:ok, direction}
    else
      :error
    end
  end
end
