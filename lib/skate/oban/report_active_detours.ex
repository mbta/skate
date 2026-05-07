defmodule Skate.Oban.ReportActiveDetours do
  @moduledoc """
  Sends active detours to S3
  """

  use Oban.Worker
  alias Skate.Detours.Detours

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    # gotta handle errors
    Detours.detours_for_report()
    :ok
  end
end
