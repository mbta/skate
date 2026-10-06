defmodule Skate.Detours.AutoclosingJob.Test do
  use Skate.DataCase
  use Oban.Testing, repo: Skate.Repo

  import Test.Support.Helpers
  import Skate.Factory

  setup do
    reassign_env(:skate, :s3_bucket, nil)

    Test.Support.AutoclosingHelpers.setup_test_group()
  end

  describe "Skate.Detours.Autoclosing.Job" do
    test "does not schedule or reschedule jobs when autoclosing is disabled" do
      test_group =
        Skate.Settings.TestGroup.get_by_name(Skate.Detours.Autoclosing.test_group_name())

      Skate.Settings.TestGroup.update(%{test_group | override: :disabled})

      detour =
        :detour
        |> build()
        |> activated(DateTime.utc_now())
        |> with_autoclose_on(DateTime.add(DateTime.utc_now(), 1, :hour))
        |> insert()

      assert {:ok, nil} = Skate.Detours.Autoclosing.Job.schedule(detour)
      assert {:ok, nil} = Skate.Detours.Autoclosing.Job.reschedule(detour)
    end

    test "when detour is activated, job is scheduled" do
      Oban.Testing.with_testing_mode(:manual, fn ->
        %{id: id, author_id: author_id} =
          :detour
          |> build()
          |> insert()

        estimated_duration = "Until end of service"

        {:ok, detour} =
          Skate.Detours.Detours.activate_detour(
            id,
            author_id,
            estimated_duration,
            "Construction"
          )

        assert_enqueued(
          worker: Skate.Detours.Autoclosing.Job,
          scheduled_at: detour.autoclose_on,
          args: %{"detour_id" => detour.id}
        )
      end)
    end

    test "when detour is updated with new selected duration, job is rescheduled" do
      Oban.Testing.with_testing_mode(:manual, fn ->
        now = DateTime.utc_now()
        autoclose_on = DateTime.add(now, 1, :hour)

        %{author_id: author_id, state: state} =
          :detour
          |> build()
          |> activated(now)
          |> with_autoclose_on(autoclose_on)
          |> insert()

        today = Date.utc_today()
        tomorrow = Date.add(today, 1)

        {:ok, detour} =
          Skate.Detours.Detours.upsert_from_snapshot(
            author_id,
            Map.merge(
              state,
              %{"selectedDuration" => "#{tomorrow.year}-#{tomorrow.month}-#{tomorrow.day}"}
            )
          )

        assert_enqueued(
          worker: Skate.Detours.Autoclosing.Job,
          scheduled_at: DateTime.new!(tomorrow, ~T[07:00:00]),
          args: %{"detour_id" => detour.id}
        )
      end)
    end

    test "rescheduling replaces the existing scheduled job" do
      Oban.Testing.with_testing_mode(:manual, fn ->
        now = DateTime.utc_now()
        old_autoclose_on = DateTime.add(now, 1, :hour)
        new_autoclose_on = DateTime.add(now, 2, :hour)

        detour =
          :detour
          |> build()
          |> activated(now)
          |> with_autoclose_on(old_autoclose_on)
          |> insert()

        assert {:ok, _job} = Skate.Detours.Autoclosing.Job.schedule(detour)

        assert {:ok, _job} =
                 Skate.Detours.Autoclosing.Job.reschedule(%{
                   detour
                   | autoclose_on: new_autoclose_on
                 })

        assert_enqueued(
          worker: Skate.Detours.Autoclosing.Job,
          scheduled_at: new_autoclose_on,
          args: %{"detour_id" => detour.id}
        )

        refute_enqueued(
          worker: Skate.Detours.Autoclosing.Job,
          scheduled_at: old_autoclose_on,
          args: %{"detour_id" => detour.id}
        )
      end)
    end

    test "when job runs, detour is deactived" do
      Oban.Testing.with_testing_mode(:inline, fn ->
        %{id: id, author_id: author_id} =
          :detour
          |> build()
          |> insert()

        {:ok, _} =
          Skate.Detours.Detours.activate_detour(
            id,
            author_id,
            "Until end of service",
            "Construction"
          )

        detour = Repo.get(Skate.Detours.Db.Detour, id)
        assert detour.status == :past
      end)
    end
  end
end
