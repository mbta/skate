defmodule Concentrate.Reporter.Latency do
  @moduledoc """
  Reporter which logs how frequently the data is updated.
  """
  @behaviour Concentrate.Reporter

  @impl Concentrate.Reporter
  def init do
    now()
  end

  @impl Concentrate.Reporter
  def log(_groups, last_update) do
    new_now = now()
    {[update_latency_ms: new_now - last_update], new_now}
  end

  defp now do
    System.monotonic_time(:millisecond)
  end
end
