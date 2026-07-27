defmodule Skate.AlertsManager.ActiveDetours.S3ExporterTest do
  use Skate.DataCase
  use Oban.Testing, repo: Skate.Repo

  require Test.Support.Helpers
  require Mox

  alias Skate.Detours.Db.Detour
  import Skate.Factory

  setup do
    Mox.stub(ExAws.Request.HttpMock, :request, fn
      _, _, _, _, _ ->
        {:ok, %{status_code: 200, body: ""}}
    end)

    :ok
  end

  describe "when job runs" do
    test "records correct number of detours" do
      # arrange
      active = 8
      inactive = 2
      total = active + inactive

      # act
      for _ <- 1..active do
        build(:detour)
        |> activated()
        |> insert()
      end

      for _ <- 1..inactive do
        insert(build(:detour))
      end

      # assert
      assert total == Skate.Repo.aggregate(Detour, :count, :id)

      assert {:ok, active} ==
               perform_job(
                 Skate.AlertsManager.ActiveDetours.S3Exporter,
                 %{}
               )
    end
  end
end
