defmodule Skate.Detours.S3ExporterTest do
  use Skate.DataCase
  use Oban.Testing, repo: Skate.Repo

  require Test.Support.Helpers
  require Mox

  alias Skate.Detours.Db.Detour
  import Skate.Factory

  use ExUnit.Case

  @telemetry_handler_id "skate.alerts_manager.active_detours.s3_exporter.test"

  defmacrop test_job_starts(do: block) do
    quote do
      pid = self()

      :telemetry.attach(
        @telemetry_handler_id,
        [:oban, :job, :start],
        fn name, measurements, metadata, _ ->
          send(pid, {:telemetry_event, name, measurements, metadata})
        end,
        []
      )

      unquote(block)

      assert_receive {:telemetry_event, name, _, metadata}
      assert name == [:oban, :job, :start]

      assert %{
               worker: "Skate.Detours.S3Exporter",
               args: %{
                 "filter" => %{"status" => "active"}
               }
             } = metadata
    end
  end

  setup do
    Mox.expect(
      ExAws.Request.HttpMock,
      :request,
      fn _, _, _, _, _ ->
        {:ok, %{status_code: 200, body: ""}}
      end
    )

    Mox.verify_on_exit!()

    on_exit(fn ->
      :telemetry.detach(@telemetry_handler_id)
    end)

    :ok
  end

  describe "when detour status changes to :active" do
    test "the job starts" do
      test_job_starts do
        %{id: id, author_id: author_id} =
          :detour
          |> build()
          |> insert()

        Skate.Detours.Detours.activate_detour(id, author_id, "1 hour", "Construction")
      end
    end
  end

  describe "when detour status changes to :past" do
    test "the job starts" do
      test_job_starts do
        %{id: id, author_id: author_id, state: snapshot} =
          :detour
          |> build()
          |> activated()
          |> insert()
          |> deactivated()

        Skate.Detours.Detours.upsert_from_snapshot(author_id, with_id(snapshot, id))
      end
    end
  end

  describe "when an active detour changes its estimated duration" do
    test "the job starts" do
      test_job_starts do
        detour =
          :detour
          |> build()
          |> activated()
          |> insert()

        # workaround because there's no `with_estimated_duration(...)` factory method
        %{author_id: author_id, id: id, state: snapshot} = %{
          detour
          | state: put_in(detour.state, ["context", "selectedDuration"], "6 hours")
        }

        Skate.Detours.Detours.upsert_from_snapshot(author_id, with_id(snapshot, id))
      end
    end
  end

  describe "when saving changes on an active detour" do
    test "the job starts" do
      test_job_starts do
        detour =
          :detour
          |> build()
          |> activated()
          |> insert()

        # workaround because there's no `with_saved_context(...)` factory method
        %{author_id: author_id, id: id, state: snapshot} = %{
          detour
          | state: put_in(detour.state, ["context", "endPoint"], %{"id" => "start"})
        }

        # `updated_at` is truncated to seconds, so ensure the save occurs in a later second.
        Process.sleep(1_100)

        Skate.Detours.Detours.upsert_from_snapshot(author_id, with_id(snapshot, id))
      end
    end
  end

  describe "when job completes" do
    test "records correct number of active detours" do
      # arrange
      active = 8
      inactive = 2
      total = active + inactive

      # act
      for _ <- 1..active do
        detour =
          :detour
          |> build()
          |> activated()
          |> with_missed_stops(for i <- 1..2, do: Integer.to_string(i))

        # workaround because there's no `with_connection_point(...)` factory method
        insert(%{
          detour
          | state:
              detour.state
              |> put_in(
                ["context", "finishedDetour", "connectionPoint"],
                %{start: %{id: 1}, end: %{id: 2}}
              )
              |> put_in(
                ["context", "finishedDetour", "routeSegments"],
                %{"beforeDetour" => [], "afterDetour" => [], "detour" => []}
              )
              |> put_in(
                ["context", "finishedDetour", "detourShape"],
                %{"coordinates" => []}
              )
        })
      end

      for _ <- 1..inactive do
        :detour
        |> build()
        |> insert()
      end

      # assert
      assert total == Skate.Repo.aggregate(Detour, :count, :id)

      assert {:ok, active} ==
               perform_job(
                 Skate.Detours.S3Exporter,
                 %{
                   filter: %{"status" => :active},
                   bucket: "test-bucket",
                   reason: "testing"
                 }
               )
    end
  end
end
