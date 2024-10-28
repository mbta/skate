defmodule Skate.Settings.VehicleAdherenceColor do
  @moduledoc false

  use Ecto.Type

  @type t :: :early_red | :early_blue

  @impl true
  def type, do: :string

  @impl true
  def cast(:early_red), do: {:ok, :early_red}
  def cast(:early_blue), do: {:ok, :early_blue}
  def cast(_), do: :error

  @impl true
  def load("early_red"), do: {:ok, :early_red}
  def load("early_blue"), do: {:ok, :early_blue}
  def load(_), do: :error

  @impl true
  def dump(:early_red), do: {:ok, "early_red"}
  def dump(:early_blue), do: {:ok, "early_blue"}
end
