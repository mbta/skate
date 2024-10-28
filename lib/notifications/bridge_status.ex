defmodule Notifications.BridgeStatus do
  @moduledoc false

  use Ecto.Type

  @type t :: :raised | :lowered

  @valid_states [:raised, :lowered]

  @impl true
  def type, do: :string

  @impl true
  def cast(state) do
    if state in @valid_states do
      {:ok, state}
    else
      :error
    end
  end

  @impl true
  def load(state) do
    state_as_atom = String.to_existing_atom(state)

    if state_as_atom in @valid_states do
      {:ok, state_as_atom}
    else
      :error
    end
  end

  @impl true
  def dump(state) do
    if state in @valid_states do
      {:ok, Atom.to_string(state)}
    else
      :error
    end
  end
end
