defmodule SkateWeb.CoreComponents do
  @moduledoc """
  Provides core UI components.
  """

  use Phoenix.HTML
  use Phoenix.Component

  def static_content_route(conn, path) do
    {static_href_module, static_href_fn} = Application.get_env(:skate, :static_href)
    static_href = fn conn, path -> apply(static_href_module, static_href_fn, [conn, path]) end

    static_href.(conn, path)
  end

  @doc """
  Generates a tag for inlined form input errors.
  """
  def form_error(assigns) do
    ~H"""
    <%= case assigns[:field].errors do %>
      <% list = [_head | _tail] -> %>
        <%= for {error, _} <- list do %>
          <span class="error-tag"><%= error %></span>
        <% end %>
      <% [] -> %>
    <% end %>
    """
  end
end
