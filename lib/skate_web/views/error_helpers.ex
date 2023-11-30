defmodule SkateWeb.ErrorHelpers do
  @moduledoc """
  Conveniences for translating and building error messages.
  """

  use Phoenix.HTML

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
