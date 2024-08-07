defmodule Skate.LocationSearch.AwsLocationRequest do
  @moduledoc false

  alias Skate.LocationSearch.Place
  alias Skate.LocationSearch.Suggestion

  @spec get(Place.id()) :: {:ok, Place.t()} | {:error, term()}
  def get(place_id) do
    request_fn = Application.get_env(:skate, :aws_request_fn, &ExAws.request/1)

    path =
      "/places/v0/indexes/" <>
        Application.get_env(:skate, :aws_place_index) <> "/places/" <> place_id

    case request_fn.(%ExAws.Operation.RestQuery{
           http_method: :get,
           path: path,
           service: :places
         }) do
      {:ok, response} -> {:ok, parse_get_response(response, place_id)}
      {:error, error} -> {:error, error}
    end
  end

  @spec search(String.t()) :: {:ok, [Place.t()]} | {:error, term()}
  def search(text) do
    request_fn = Application.get_env(:skate, :aws_request_fn, &ExAws.request/1)

    path =
      "/places/v0/indexes/" <> Application.get_env(:skate, :aws_place_index) <> "/search/text"

    case request_fn.(%ExAws.Operation.RestQuery{
           http_method: :post,
           path: path,
           body: Map.merge(base_arguments(), %{Text: String.byte_slice(text, 0, 200)}),
           service: :places
         }) do
      {:ok, response} -> {:ok, parse_search_response(response)}
      {:error, error} -> {:error, error}
    end
  end

  @spec suggest(String.t()) :: {:ok, [Suggestion.t()]} | {:error, term()}
  def suggest(text) do
    request_fn = Application.get_env(:skate, :aws_request_fn, &ExAws.request/1)

    path =
      "/places/v0/indexes/" <>
        Application.get_env(:skate, :aws_place_index) <> "/search/suggestions"

    case request_fn.(%ExAws.Operation.RestQuery{
           http_method: :post,
           path: path,
           body: Map.merge(base_arguments(), %{Text: String.byte_slice(text, 0, 200)}),
           service: :places
         }) do
      {:ok, response} -> {:ok, parse_suggest_response(response)}
      {:error, error} -> {:error, error}
    end
  end

  defp parse_get_response(%{status_code: 200, body: body}, place_id) do
    %{"Place" => place} = Jason.decode!(body)

    %{"Label" => label, "Geometry" => %{"Point" => [longitude, latitude]}} = place

    {name, address} =
      separate_label_text(label, Map.get(place, "AddressNumber"), Map.get(place, "Street"))

    %Place{
      id: place_id,
      name: name,
      address: address,
      latitude: latitude,
      longitude: longitude
    }
  end

  defp parse_search_response(%{status_code: 200, body: body}) do
    %{"Results" => results} = Jason.decode!(body)

    Enum.map(results, fn result ->
      %{"PlaceId" => id, "Place" => place} = result

      %{"Label" => label, "Geometry" => %{"Point" => [longitude, latitude]}} = place

      {name, address} =
        separate_label_text(label, Map.get(place, "AddressNumber"), Map.get(place, "Street"))

      %Place{
        id: id,
        name: name,
        address: address,
        latitude: latitude,
        longitude: longitude
      }
    end)
  end

  defp parse_suggest_response(%{status_code: 200, body: body}) do
    %{"Results" => results} = Jason.decode!(body)

    Enum.map(results, fn result ->
      text = Map.get(result, "Text")
      place_id = Map.get(result, "PlaceId")

      %Suggestion{text: text, place_id: place_id}
    end)
  end

  @spec separate_label_text(String.t(), String.t() | nil, String.t() | nil) ::
          {String.t() | nil, String.t()}
  defp separate_label_text(label, nil, nil), do: {nil, label}

  defp separate_label_text(label, address_number, street) do
    address_prefix = address_number || street

    case address_prefix
         |> Regex.escape()
         |> Regex.compile!()
         |> Regex.split(label, parts: 2, include_captures: true) do
      ["", prefix, address] ->
        {nil, prefix <> address}

      [name, prefix, address] ->
        {Regex.replace(~r/, $/, name, ""), prefix <> address}

      [prefix, address] ->
        {nil, prefix <> address}
    end
  end

  defp base_arguments do
    map_limits = Application.get_env(:skate, :map_limits)

    %{
      FilterBBox: [map_limits[:west], map_limits[:south], map_limits[:east], map_limits[:north]]
    }
  end
end
