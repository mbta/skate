defmodule Skate.Detours.NotificationSchedulerTest do
  use Skate.DataCase
  import Skate.Factory

  alias Skate.Detours.NotificationScheduler
  alias Skate.Detours.Db.DetourExpirationTask

  describe "detour_activated/2" do
    test "creates a new record when a detour is activated" do
      detour = :detour |> insert() |> activated()
      expires_at = DateTime.utc_now()
      detour_id = detour.id

      assert {:ok, [detour_expiration_task1, detour_expiration_task2]} =
               NotificationScheduler.detour_activated(detour, expires_at)

      assert %DetourExpirationTask{detour_id: ^detour_id, expires_at: ^expires_at} =
               detour_expiration_task1

      assert %DetourExpirationTask{detour_id: ^detour_id, expires_at: ^expires_at} =
               detour_expiration_task2
    end

    test "does not create a new record if detour has not been activated" do
      detour = :detour |> insert() |> deactivated()
      assert :error = NotificationScheduler.detour_activated(detour, DateTime.utc_now())
    end
  end

  describe "detour_deactivated/1" do
    test "deletes record if record still exists and detour is deactivated" do
      detour = :detour |> insert() |> activated()
      expires_at = DateTime.utc_now()

      assert {:ok, [detour_expiration_task1, detour_expiration_task2]} =
               NotificationScheduler.detour_activated(detour, expires_at)

      detour = deactivated(detour)
      assert {2, _} = NotificationScheduler.detour_deactivated(detour)
      refute Skate.Repo.get(DetourExpirationTask, detour_expiration_task1.id)
      refute Skate.Repo.get(DetourExpirationTask, detour_expiration_task2.id)
    end

    test "does not delete a record if detour is currently still active" do
      detour = :detour |> insert() |> activated()
      assert :error = NotificationScheduler.detour_deactivated(detour)
    end
  end

  describe "detour_duration_changed/2" do
    test "updates record if exists and expires_at value changes" do
      detour = :detour |> insert() |> activated()
      expires_at = DateTime.utc_now()

      assert {:ok, [detour_expiration_task1, detour_expiration_task2]} =
               NotificationScheduler.detour_activated(detour, expires_at)

      new_expires_at = DateTime.add(expires_at, 20, :minute)

      assert {:ok, [updated_detour_expiration_task1, updated_detour_expiration_task2]} =
               NotificationScheduler.detour_duration_changed(detour, new_expires_at)

      assert new_expires_at == updated_detour_expiration_task1.expires_at
      assert detour_expiration_task1.id == updated_detour_expiration_task1.id
      assert new_expires_at == updated_detour_expiration_task2.expires_at
      assert detour_expiration_task2.id == updated_detour_expiration_task2.id
    end

    test "creates record if previous notification did not exist because of 'Until further notice' estimated duration" do
      detour = :detour |> insert() |> activated()
      expires_at = DateTime.utc_now()

      assert {:ok, [updated_detour_expiration_task1, updated_detour_expiration_task2]} =
               NotificationScheduler.detour_duration_changed(detour, expires_at)

      assert expires_at == updated_detour_expiration_task1.expires_at
      assert expires_at == updated_detour_expiration_task2.expires_at
    end

    test "does not update a record if detour is not currently active" do
      detour = :detour |> insert() |> deactivated()
      expires_at = DateTime.utc_now()
      assert :error = NotificationScheduler.detour_duration_changed(detour, expires_at)
    end
  end
end
