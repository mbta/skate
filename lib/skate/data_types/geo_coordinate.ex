defmodule Skate.DataTypes.GeoCoordinate do
  @moduledoc """
  Represents a Latitude Longitude pair.
  """
  use Skate.Schema
  import Ecto.Changeset
  alias Skate.DataTypes.GeoCoordinate

  @primary_key false
  typed_embedded_schema do
    field :latitude, :float
    field :longitude, :float
  end

  @doc false
  def changeset(%GeoCoordinate{} = geo_coordinate, attrs) do
    geo_coordinate
    |> cast(latlon_to_geocoordinate(attrs), [:latitude, :longitude])
    |> validate_required([:latitude, :longitude])
  end

  defp latlon_to_geocoordinate(%{"lat" => lat, "lon" => lon}) do
    %{
      latitude: lat,
      longitude: lon
    }
  end

  defp latlon_to_geocoordinate(attrs), do: attrs
end
