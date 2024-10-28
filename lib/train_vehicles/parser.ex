defmodule TrainVehicles.Parser do
  @moduledoc false

  alias TrainVehicles.TrainVehicle

  @spec parse(JsonApi.Item.t()) :: TrainVehicle.t()
  def parse(%JsonApi.Item{id: id, attributes: attributes, relationships: relationships}) do
    %TrainVehicle{
      id: id,
      route_id: optional_id(relationships["route"]),
      longitude: attributes["longitude"],
      latitude: attributes["latitude"],
      bearing: attributes["bearing"] || 0
    }
  end

  @spec optional_id([JsonApi.Item.t()]) :: String.t() | nil
  defp optional_id([]), do: nil
  defp optional_id([%JsonApi.Item{id: id}]), do: id
end
