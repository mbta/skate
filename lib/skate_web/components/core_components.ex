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

  defp banner_background_color("skate-local"), do: "var(--color-mbta-silver)"
  defp banner_background_color("skate-dev"), do: "var(--color-mbta-cr)"
  defp banner_background_color("skate-dev-blue"), do: "var(--color-mbta-blue)"
  defp banner_background_color("skate-dev-green"), do: "var(--color-mbta-green)"
  defp banner_background_color("skate-prod"), do: "var(--color-mbta-red)"
  defp banner_background_color(_), do: "var(--color-mbta-bus)"

  defp banner_font_color("skate-local"), do: "white"
  defp banner_font_color("skate-dev"), do: "white"
  defp banner_font_color("skate-dev-blue"), do: "white"
  defp banner_font_color("skate-dev-green"), do: "white"
  defp banner_font_color("skate-prod"), do: "white"
  defp banner_font_color(_), do: "black"

  @doc """
  Generates a banner for the top of the admin page
  """
  def admin_banner(assigns) do
    env = Application.get_env(:skate, :environment_name)

    attributes = %{
      class: "banner",
      style: "background-color: #{banner_background_color(env)}; color: #{banner_font_color(env)}"
    }

    assigns =
      assigns
      |> assign(:env, env)
      |> assign(:attributes, attributes)

    ~H"""
    <div {@attributes}>
      Environment: <%= @env %>
    </div>
    """
  end
end
