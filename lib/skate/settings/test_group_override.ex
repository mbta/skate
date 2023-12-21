defmodule Skate.Settings.TestGroupOverride do
  use Ecto.Type

  def type, do: :string

  # @valid_states [:enabled, :disabled, :none]

  # @impl
  def cast(_term) do
  end

  # @impl
  def dump(_term) do
  end

  # @impl
  def load(_term) do
  end
end
