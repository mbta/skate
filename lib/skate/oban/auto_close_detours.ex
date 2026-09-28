defmodule Skate.Oban.AutoCloseDetours do
  @moduledoc """
  Marks active detours past once their autoclose time has elapsed.
  """

  require Logger

  use Oban.Worker, queue: :default

  alias Skate.Detours.Detours

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    count = Detours.autoclose_expired_detours()
    Logger.notice("autoclosed expired detours count=#{count}")
    {:ok, count}
  end
end
