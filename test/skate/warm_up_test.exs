defmodule Skate.WarmUpTest do
  use ExUnit.Case
  import Test.Support.Helpers
  import ExUnit.CaptureLog

  describe("init/1") do
    test "returns :ok if test function succeeds at least the required number of times" do
      reassign_env(:skate, Skate.WarmUp, minimum_percent_queries_to_succeed: 0.5)
      reassign_env(:skate, Skate.Repo, pool_size: 10)

      reassign_env(:skate, :warm_up_test_fn, fn count, _attempt ->
        if count <= 8, do: {:ok, :success}, else: {:error, :failure}
      end)

      set_log_level(:info)

      {result, log} = with_log(fn -> Skate.WarmUp.init("initial_state") end)

      assert :ignore = result

      assert log =~
               "Elixir.Skate.WarmUp Repo warm-up attempt complete. status=success count_query_success=9 total_query_count=10"
    end

    test "returns :ok if fails on first try and succeeds on second" do
      reassign_env(:skate, Skate.WarmUp, minimum_percent_queries_to_succeed: 0.8)
      reassign_env(:skate, Skate.WarmUp, max_attempts: 2)

      reassign_env(:skate, :warm_up_test_fn, fn _count, attempt ->
        if attempt == 1 do
          {:error, :failure}
        else
          {:ok, :success}
        end
      end)

      set_log_level(:info)

      {result, log} = with_log(fn -> Skate.WarmUp.init("initial_state") end)

      assert :ignore = result

      assert log =~
               "[warning] Elixir.Skate.WarmUp Repo warm-up attempt complete. status=failure count_query_success=0 total_query_count=10 attempt=1"

      assert log =~
               "[info] Elixir.Skate.WarmUp Repo warm-up attempt complete. status=success count_query_success=10 total_query_count=10 attempt=2"
    end

    test "retries on failure the configured number of times before returning stop" do
      reassign_env(:skate, Skate.WarmUp, minimum_percent_queries_to_succeed: 0.8)
      reassign_env(:skate, Skate.WarmUp, max_attempts: 2)

      reassign_env(:skate, Skate.Repo, pool_size: 10)

      reassign_env(:skate, :warm_up_test_fn, fn count, _attempt ->
        if count <= 3, do: {:ok, :success}, else: {:error, :failure}
      end)

      {result, log} = with_log(fn -> Skate.WarmUp.init("initial_state") end)

      assert {:stop,
              "Elixir.Skate.WarmUp Repo warm-up attempt complete. status=failure count_query_success=4 total_query_count=10 attempt=2"} =
               result

      assert log =~
               "[warning] Elixir.Skate.WarmUp Repo warm-up attempt complete. status=failure count_query_success=4 total_query_count=10 attempt=1"

      assert log =~
               "[error] Elixir.Skate.WarmUp Repo warm-up attempt complete. status=failure count_query_success=4 total_query_count=10 attempt=2"
    end
  end
end
