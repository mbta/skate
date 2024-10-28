defmodule SkateWeb.Layouts do
  @moduledoc """
  Components representing the layouts that we use for pages in Skate 
  """

  use SkateWeb, :html

  @spec record_fullstory?() :: boolean
  def record_fullstory?, do: Application.get_env(:skate, :record_fullstory, false)

  @spec record_appcues?() :: boolean
  def record_appcues?, do: Application.get_env(:skate, :record_appcues, false)

  @spec record_sentry?() :: boolean
  def record_sentry?, do: !is_nil(Application.get_env(:skate, :sentry_frontend_dsn))

  @spec drift_enabled?() :: boolean
  def drift_enabled?, do: Application.get_env(:skate, :enable_drift, true)

  embed_templates("layouts/*")
end
