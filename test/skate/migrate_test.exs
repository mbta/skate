defmodule Skate.MigrateTest do
  use ExUnit.Case
  import Test.Support.Helpers
  import ExUnit.CaptureLog

  describe "start_link/1" do
    test "when all migrations run successfully, starts & exits successfully" do
      test_pid = self()

      pid =
        start_supervised!(
          {Skate.Migrate,
           run_sync_migrations: fn ->
             send(test_pid, :sync_migrations_ran)
             :ok
           end,
           run_async_migrations: fn ->
             send(test_pid, :async_migrations_ran)
             :ok
           end}
        )

      assert :ok = await_stopped(pid)

      assert_receive :sync_migrations_ran
      assert_receive :async_migrations_ran
    end

    test "when sync migrations fail, raises an error and async migrations are not run" do
      test_pid = self()

      assert_raise RuntimeError, ~r/migration error/, fn ->
        start_supervised!(
          {Skate.Migrate,
           run_sync_migrations: fn ->
             raise RuntimeError, "migration error"
           end,
           run_async_migrations: fn ->
             send(test_pid, :async_migrations_ran)
             :ok
           end}
        )
      end

      refute_receive :async_migrations_ran
    end

    test "when sync migrations succeed but async migrations fail, still starts successfully then shuts down normally." do
      test_pid = self()

      pid =
        start_supervised!(
          {Skate.Migrate,
           run_sync_migrations: fn ->
             send(test_pid, :sync_migrations_ran)
           end,
           run_async_migrations: fn ->
             raise RuntimeError, "migration error"
           end}
        )

      assert :ok = await_stopped(pid)

      assert_receive :sync_migrations_ran
      refute_receive :async_migrations_ran
    end
  end

  describe "handle_continue/1" do
    test "when async migrations ran successfully, logs & returns normal stop" do
      set_log_level(:info)

      {result, log} =
        with_log(fn ->
          Skate.Migrate.handle_continue(:async_migrations,
            run_async_migrations: fn -> :ok end
          )
        end)

      assert {:stop, :normal, _opts} = result
      assert log =~ "Elixir.Skate.Migrate async migrations starting"
      assert log =~ "Elixir.Skate.Migrate async migrations finished"
    end

    test "when async migrations raises an exception, logs & returns normal stop" do
      set_log_level(:info)

      {result, log} =
        with_log(fn ->
          Skate.Migrate.handle_continue(:async_migrations,
            run_async_migrations: fn -> raise RuntimeError, "migration error" end
          )
        end)

      assert {:stop, :normal, _opts} = result

      assert log =~ "Elixir.Skate.Migrate async migrations starting"

      assert log =~
               "Elixir.Skate.Migrate async migrations failed. error=%RuntimeError{message: \"migration error\"}"
    end
  end

  defp await_stopped(pid) do
    ref = Process.monitor(pid)

    receive do
      {:DOWN, ^ref, :process, ^pid, good_exit} when good_exit in [:normal, :noproc] ->
        refute Process.alive?(pid)
        :ok

      {:DOWN, ^ref, :process, ^pid, exit} ->
        {:error, exit}
    after
      5_000 ->
        {:error, :timeout}
    end
  end
end
