defmodule Skate.LocationSearch.AwsLocationRequest do
  alias Skate.LocationSearch.SearchResult

  @base_arguments %{
    FilterBBox: [-72, 41.2, -69.8, 43]
  }

  @spec search(String.t()) :: {:ok, map()} | {:error, term()}
  def search(text) do
    request_fn = Application.get_env(:skate, :aws_request_fn, &ExAws.request/1)

    path =
      "/places/v0/indexes/" <> Application.get_env(:skate, :aws_place_index) <> "/search/text"

    %ExAws.Operation.RestQuery{
      http_method: :post,
      path: path,
      body: Map.merge(@base_arguments, %{Text: text}),
      service: :places
    }
    |> request_fn.()
  end

  def parse_search_response(%{status_code: 200, body: body}) do
    %{"Results" => results} = Jason.decode!(body)

    Enum.map(results, fn result ->
      %{"PlaceId" => id, "Place" => place} = result

      %{"Label" => label, "Geometry" => %{"Point" => [longitude, latitude]}} = place

      {name, address} =
        separate_label_text(label, Map.get(place, "AddressNumber"), Map.get(place, "Street"))

      %SearchResult{
        id: id,
        name: name,
        address: address,
        latitude: latitude,
        longitude: longitude
      }
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
end
