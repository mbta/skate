defmodule SkateWeb.CoreComponents do
  @moduledoc """
  Provides core UI components.
  """

  use Phoenix.HTML

  def static_content_route(conn, path) do
    {static_href_module, static_href_fn} = Application.get_env(:skate, :static_href)
    static_href = fn conn, path -> apply(static_href_module, static_href_fn, [conn, path]) end

    static_href.(conn, path)
  end

  @doc """
  Generates a tag for inlined form input errors.
  """
  def error_tag(form, field) do
    case form.errors[field] do
      {error, _} ->
        content_tag(:span, error, class: "error-tag")

      _ ->
        nil
    end
  end
end
