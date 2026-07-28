defmodule Skate.AlertsManager.ActiveDetours.S3ExporterTest do
  use Skate.DataCase
  use Oban.Testing, repo: Skate.Repo

  require Test.Support.Helpers
  require Mox

  alias Skate.Detours.Db.Detour
  import Skate.Factory

  use ExUnit.Case

  @telemetry_handler_id "skate.alerts_manager.active_detours.s3_exporter.test"

  defp attach_telemetry_handler_oban_job_start_event(
         pid,
         handler_id \\ @telemetry_handler_id
       ) do
    :telemetry.attach(
      handler_id,
      [:oban, :job, :start],
      fn name, measurements, metadata, _ ->
        send(pid, {:telemetry_event, name, measurements, metadata})
      end,
      []
    )
  end

  setup do
    on_exit(fn ->
      :telemetry.detach(@telemetry_handler_id)
    end)
  end

  setup do
    Mox.stub(
      ExAws.Request.HttpMock,
      :request,
      fn _, _, _, _, _ ->
        {:ok, %{status_code: 200, body: ""}}
      end
    )

    :ok
  end

  describe "starts job" do
    for status <- ["activated", "deactivated"] do
      @tag status: status
      test "when detour is #{status}", %{status: status} do
        this = self()
        label = "skate.alerts_manager.active_detours.s3_exporter.test"

        :telemetry.attach(
          label,
          [:oban, :job, :start],
          fn name, measurements, metadata, _ ->
            send(this, {:telemetry_event, name, measurements, metadata})
          end,
          []
        )

        case status do
          "activated" ->
            detour = insert(build(:detour))

            Skate.Detours.Detours.activate_detour(
              detour.id,
              detour.author_id,
              "1 hour",
              "Construction"
            )

          "deactivated" ->
            detour =
              build(:detour)
              |> activated()
              |> insert()

            %{state: snapshot} = deactivated(detour)

            Skate.Detours.Detours.upsert_from_snapshot(
              detour.author_id,
              with_id(snapshot, detour.id)
            )
        end

        assert_receive {:telemetry_event, name, _, _}
        assert name == [:oban, :job, :start]

        :telemetry.detach(label)
      end
    end
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
