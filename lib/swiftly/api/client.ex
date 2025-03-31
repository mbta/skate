defmodule Swiftly.API.Client do
  @moduledoc """
  HTTP Client and Behaviour for sending and receiving HTTP for `Swiftly.API.ServiceAdjustments`
  """

  @callback request(HTTPoison.Request.t()) ::
              {:ok, HTTPoison.Response.t()}
              | {:error, HTTPoison.Error.t()}

  defdelegate request(request), to: HTTPoison
end
