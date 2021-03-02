defmodule Skate.Settings.TripLabel do
  use Ecto.Type

  @type t :: :origin | :destination

  @impl true
  def type, do: :string

  @impl true
  def cast(:origin), do: {:ok, :origin}
  def cast(:destination), do: {:ok, :destination}
  def cast(_), do: :error

  @impl true
  def load("origin"), do: {:ok, :origin}
  def load("destination"), do: {:ok, :destination}
  def load(_), do: :error

  @impl true
  def dump(:origin), do: {:ok, "origin"}
  def dump(:destination), do: {:ok, "destination"}
end
