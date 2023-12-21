defmodule Skate.Settings.TestGroupOverride do
  @moduledoc false

  use Ecto.Type

  def type, do: :string

  @valid_states [:enabled, :disabled, :none]

  # @impl
  def cast(term) when term in @valid_states, do: {:ok, term}
  def cast(_), do: :error

  # @impl
  def dump(term) when term in @valid_states, do: {:ok, Atom.to_string(term)}
  def dump(_), do: :error

  # @impl
  def load(term) do
    term |> String.to_existing_atom() |> cast()
  end
end
