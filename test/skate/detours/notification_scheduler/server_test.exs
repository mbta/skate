defmodule Skate.Detours.NotificationScheduler.ServerTest do
  @moduledoc """
  Interface for managing scheduled detour notifications.
  """
  alias Skate.Detours.NotificationScheduler.Worker
  use Skate.DataCase
  import Skate.Factory

  import Test.Support.Helpers
  import ExUnit.CaptureLog, only: [capture_log: 2]

  alias Skate.Detours.NotificationScheduler.Server
  alias Skate.Detours.Db.{Detour, DetourExpirationTask}

  def setup_server() do
    Server.start_link([{:poll_ms, 100}])
  end

  def setup_expiration_task() do
    %Detour{} =
      detour = :detour |> build |> activated |> insert()

    now = DateTime.utc_now()

    %DetourExpirationTask{} =
      :detour_expiration_task |> build(detour: detour, expires_at: now) |> insert()
  end

  describe "Server" do
    setup do
      set_log_level(:info)
      setup_expiration_task()

      :ok
    end

    test "processes detour expiration notifications" do
      log =
        capture_log([level: :info], fn ->
          {:ok, _server} = setup_server()
          Process.sleep(200)
        end)

      assert log =~ "Notification.create_detour_expiration_notification/2"
    end
  end
end
