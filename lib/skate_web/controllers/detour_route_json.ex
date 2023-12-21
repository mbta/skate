defmodule SkateWeb.DetourRouteJSON do
  @doc """
  Renders a list of detour_route.
  """
  def result(%{data: data}) do
    %{data: data}
  end

  def error(%{error: error}) do
    %{error: error}
  end
end
