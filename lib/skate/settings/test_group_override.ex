defmodule Skate.Settings.TestGroupOverride do
  @moduledoc false

  use Ecto.Type

  @type t :: :enabled | :disabled | :none

  @impl true
  def type, do: :string

  @valid_states [:enabled, :disabled, :none]

  @impl true
  def cast(term) when term in @valid_states, do: {:ok, term}
  def cast(_), do: :error

  @impl true
  def dump(term) when term in @valid_states, do: {:ok, Atom.to_string(term)}
  def dump(_), do: :error

  @impl true
  def load(term) do
    term |> String.to_existing_atom() |> cast()
  end
end
