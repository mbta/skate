defmodule Geonames do
  require Logger

  @spec nearest_intersection(String.t(), String.t()) :: String.t() | nil
  def nearest_intersection(latitude, longitude) do
    case get(latitude, longitude) do
      nil ->
        nil

      data ->
        parse(data)
    end
  end

  @spec get(String.t(), String.t()) :: map() | nil
  defp get(latitude, longitude) do
    geonames_url_base = Application.get_env(:skate, :geonames_url_base)
    geonames_token = Application.get_env(:skate, :geonames_token)
    token_param = if geonames_token, do: "&token=#{geonames_token}", else: ""

    url =
      "#{geonames_url_base}/findNearestIntersectionOSMJSON?lat=#{latitude}&lng=#{longitude}&username=mbta_busloc#{
        token_param
      }"

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
