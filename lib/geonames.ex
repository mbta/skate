defmodule Geonames do
  require Logger

  @spec nearest_intersection(String.t(), String.t()) :: String.t() | nil
  def nearest_intersection(latitude, longitude) do
    call_fn = Application.get_env(:skate, :geonames_fn, &call/2)

    case call_fn.(latitude, longitude) do
      nil ->
        nil

      data ->
        parse(data)
    end
  end

  @spec call(String.t(), String.t()) :: map() | nil
  defp call(latitude, longitude) do
    url =
      "http://api.geonames.org/findNearestIntersectionJSON?lat=#{latitude}&lng=#{longitude}&username=mbta_busloc"

    case HTTPoison.get(url) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        body
        |> Jason.decode!(strings: :copy)

      response ->
        Logger.warn(fn -> "Unexpected response from #{url} : #{inspect(response)}" end)
        nil
    end
  end

  @spec parse(map()) :: String.t() | nil
  defp parse(data) do
    if Map.has_key?(data, "intersection") do
      "#{data["intersection"]["street1"]} & #{data["intersection"]["street2"]}"
    else
      nil
    end
  end
end
