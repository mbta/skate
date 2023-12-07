defmodule SkateWeb.LayoutView do
  use SkateWeb, :html
  use SkateWeb, :view

  @spec record_fullstory?() :: boolean
  def record_fullstory?, do: Application.get_env(:skate, :record_fullstory, false)

  @spec record_appcues?() :: boolean
  def record_appcues?, do: Application.get_env(:skate, :record_appcues, false)

  @spec record_sentry?() :: boolean
  def record_sentry?, do: !is_nil(Application.get_env(:skate, :sentry_frontend_dsn))

  embed_templates("../templates/layout/*")
end
