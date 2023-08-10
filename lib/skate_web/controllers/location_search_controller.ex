defmodule SkateWeb.LocationSearchController do
  use SkateWeb, :controller

  alias Skate.LocationSearch.AwsLocationRequest

  @spec get(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def get(conn, %{"id" => id}) do
    get_fn = Application.get_env(:skate, :location_get_fn, &AwsLocationRequest.get/1)

    {:ok, result} = get_fn.(id)

    json(conn, %{data: result})
  end

  @spec search(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def search(conn, %{"query" => query}) do
    search_fn = Application.get_env(:skate, :location_search_fn, &AwsLocationRequest.search/1)

    {:ok, result} = search_fn.(query)

    json(conn, %{data: result})
  end

  @spec suggest(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def suggest(conn, %{"query" => query}) do
    suggest_fn = Application.get_env(:skate, :location_suggest_fn, &AwsLocationRequest.suggest/1)

    {:ok, result} = suggest_fn.(query)

    json(conn, %{data: result})
  end
end
