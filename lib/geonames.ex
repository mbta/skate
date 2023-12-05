defmodule Geonames do
  @moduledoc false

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

  @spec get(String.t(), String.t(), boolean()) :: map() | nil
  defp get(latitude, longitude, retry? \\ true) do
    geonames_url_base = Application.get_env(:skate, :geonames_url_base)
    geonames_token = Application.get_env(:skate, :geonames_token)
    token_param = if geonames_token, do: "&token=#{geonames_token}", else: ""

    url =
      "#{geonames_url_base}/findNearestIntersectionOSMJSON?lat=#{latitude}&lng=#{longitude}&username=mbta_busloc#{token_param}"

    sanitized_url =
      if geonames_token do
        String.replace(url, geonames_token, "SECRET")
      else
        url
      end

    {time, result} = :timer.tc(HTTPoison, :get, [url])

    time_in_ms = time / :timer.seconds(1)

    case result do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        Logger.info(
          "#{__MODULE__} got_intersection_response url=#{sanitized_url} time=#{time_in_ms}"
        )

        Jason.decode!(body, strings: :copy)

      response ->
        Logger.warning(
          "#{__MODULE__} unexpected_response url=#{sanitized_url} response=#{inspect(response)} time=#{time_in_ms} retry=#{retry?}"
        )

        if retry? do
          get(latitude, longitude, false)
        else
          nil
        end
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
