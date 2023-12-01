defmodule Skate.Settings.VehicleLabel do
  @moduledoc false

  use Ecto.Type

  @type t :: :run_id | :vehicle_id

  @impl true
  def type, do: :string

  @impl true
  def cast(:run_id), do: {:ok, :run_id}
  def cast(:vehicle_id), do: {:ok, :vehicle_id}
  def cast(_), do: :error

  @impl true
  def load("run_id"), do: {:ok, :run_id}
  def load("vehicle_id"), do: {:ok, :vehicle_id}
  def load(_), do: :error

  @impl true
  def dump(:run_id), do: {:ok, "run_id"}
  def dump(:vehicle_id), do: {:ok, "vehicle_id"}
end
