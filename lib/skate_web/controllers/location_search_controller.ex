defmodule SkateWeb.LocationSearchController do
  use SkateWeb, :controller

  alias Skate.LocationSearch.AwsLocationRequest

  @spec search(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def search(conn, %{"query" => query}) do
    seach_fn = Application.get_env(:skate, :location_search_fn, &AwsLocationRequest.search/1)

    parse_fn =
      Application.get_env(:skate, :location_parse_fn, &AwsLocationRequest.parse_search_response/1)

    {:ok, response} = seach_fn.(query)

    result = parse_fn.(response)

    json(conn, %{data: result})
  end

  @spec suggest(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def suggest(conn, %{"query" => query}) do
    suggest_fn = Application.get_env(:skate, :location_suggest_fn, &AwsLocationRequest.suggest/1)

    parse_fn =
      Application.get_env(
        :skate,
        :location_parse_fn,
        &AwsLocationRequest.parse_suggest_response/1
      )

    {:ok, response} = suggest_fn.(query)

    result = parse_fn.(response)

    json(conn, %{data: result})
  end
end
