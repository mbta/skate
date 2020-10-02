defmodule SkateWeb.LayoutView do
  use SkateWeb, :view

  def get_csrf_token, do: Plug.CSRFProtection.get_csrf_token()

  @spec record_fullstory?() :: boolean
  def record_fullstory?, do: Application.get_env(:skate, :record_fullstory, false)

  @spec record_appcues?() :: boolean
  def record_appcues?, do: Application.get_env(:skate, :record_appcues, false)

  @spec record_sentry?() :: boolean
  def record_sentry?, do: Application.get_env(:skate, :record_sentry, false)
end
