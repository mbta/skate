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

  describe "when detour status changes" do
    for status <- [:active, :past] do
      @tag status: status

      test "to #{status} the job starts", %{status: status} do
        # arrange
        attach_telemetry_handler_oban_job_start_event(self())

        # act
        case status do
          :active ->
            detour =
              :detour
              |> build()
              |> insert()

            Skate.Detours.Detours.activate_detour(
              detour.id,
              detour.author_id,
              "1 hour",
              "Construction"
            )

          :past ->
            detour =
              :detour
              |> build()
              |> activated()
              |> insert()

            %{state: snapshot} = deactivated(detour)

            Skate.Detours.Detours.upsert_from_snapshot(
              detour.author_id,
              with_id(snapshot, detour.id)
            )
        end

        # assert
        assert_receive {:telemetry_event, name, _, _}
        assert name == [:oban, :job, :start]
      end
    end
  end

  describe "when an active detour changes" do
    test "the job starts" do
      # arrange
      attach_telemetry_handler_oban_job_start_event(self())

      # act
      detour =
        :detour
        |> build()
        |> activated()
        |> insert()

      %{state: snapshot} = with_updated_at(detour, DateTime.now!("Etc/UTC"))

      Skate.Detours.Detours.upsert_from_snapshot(
        detour.author_id,
        with_id(snapshot, detour.id)
      )

      # assert
      assert_receive {:telemetry_event, name, _, _}
      assert name == [:oban, :job, :start]
    end
  end

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
