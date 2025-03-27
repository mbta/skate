defmodule Swiftly.API.Client do
  @callback request(HTTPoison.Request.t()) ::
              {:ok, HTTPoison.Response.t()}
              | {:error, HTTPoison.Error.t()}

  defdelegate request(request), to: HTTPoison
end
