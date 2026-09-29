defmodule Skate.Detours.AutoclosingJob.Test do
  use Skate.DataCase
  use Oban.Testing, repo: Skate.Repo

  import Test.Support.Helpers
  import Skate.Factory

  setup do
    reassign_env(:skate, :s3_bucket, nil)

    with :ok <- Skate.Detours.Autoclosing.Test.setup_feature_flag(),
         :ok <- Skate.Detours.Autoclosing.Test.setup_test_group() do
      :ok
    else
      _ -> :error
    end
  end

  describe "Skate.Detours.Autoclosing.Job" do
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

    test "when detour is updated with new selected duration, job is scheduled" do
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
          scheduled_at: detour.autoclose_on,
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
