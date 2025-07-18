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

    test "does not create a new record if detour has a 'Until further notice' estimated duration" do
      detour = :detour |> insert() |> activated()
      refute NotificationScheduler.detour_activated(detour, nil)
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

    test "deletes records if a detour's estimated duration is changed to 'Until further notice' (doesn't expire)" do
      detour = :detour |> insert() |> activated()
      expires_at = DateTime.utc_now()
      updated_expires_at = nil

      assert {:ok, [%DetourExpirationTask{}, %DetourExpirationTask{}]} =
               NotificationScheduler.detour_duration_changed(detour, expires_at)

      assert {2, nil} =
               NotificationScheduler.detour_duration_changed(detour, updated_expires_at)
    end

    test "does not update a record if detour is not currently active" do
      detour = :detour |> insert() |> deactivated()
      expires_at = DateTime.utc_now()
      assert :error = NotificationScheduler.detour_duration_changed(detour, expires_at)
    end
  end

  describe "tasks_ready_to_run/0" do
    test "queries for tasks ready to be run" do
      %Skate.Detours.Db.Detour{} =
        detour = :detour |> build |> activated |> insert()

      detour_id = detour.id

      now = DateTime.utc_now()

      # task expiring now
      %Skate.Detours.Db.DetourExpirationTask{} =
        :detour_expiration_task |> build(detour: detour, expires_at: now) |> insert()

      in_30 = DateTime.add(now, 30, :minute)

      # task expiring in 30
      %Skate.Detours.Db.DetourExpirationTask{} =
        :detour_expiration_task
        |> build(detour: detour, expires_at: in_30, notification_offset_minutes: 30)
        |> insert()

      in_one_hour = DateTime.add(now, 60, :minute)

      # task expiring in one hour
      %Skate.Detours.Db.DetourExpirationTask{} =
        :detour_expiration_task
        |> build(detour: detour, expires_at: in_one_hour, notification_offset_minutes: 0)
        |> insert()

      %Skate.Detours.Db.DetourExpirationTask{} =
        :detour_expiration_task
        |> build(detour: detour, expires_at: in_one_hour, notification_offset_minutes: 30)
        |> insert()

      tasks = NotificationScheduler.tasks_ready_to_run()

      [task1 | rest] = tasks

      # 0 minute notification
      assert %DetourExpirationTask{
               detour: %{id: ^detour_id},
               expires_at: expires_at,
               notification_offset_minutes: 0
             } = task1

      assert expires_at <= now

      # Only task expiring in 30 minutes, tasks expiring later aren't returned
      [task2 | []] = rest

      # 30 minute notification
      assert %DetourExpirationTask{
               detour: %{id: ^detour_id},
               expires_at: expires_at,
               notification_offset_minutes: 30
             } = task2

      assert expires_at <= in_30
    end

    test "handles tasks that should have been run but have not been yet" do
      %Skate.Detours.Db.Detour{} =
        detour = :detour |> build |> activated |> insert()

      detour_id = detour.id

      now = DateTime.utc_now()
      past = DateTime.add(now, -60, :minute)

      %Skate.Detours.Db.DetourExpirationTask{} =
        :detour_expiration_task |> build(detour: detour) |> expires(past) |> insert()

      even_older = DateTime.add(now, -120, :minute)

      %Skate.Detours.Db.DetourExpirationTask{} =
        :detour_expiration_task
        |> build(detour: detour)
        |> expires(even_older)
        |> completed()
        |> insert()

      tasks = NotificationScheduler.tasks_ready_to_run()

      [task1 | []] = tasks

      # only the scheduled notification
      assert %DetourExpirationTask{
               detour: %{id: ^detour_id},
               expires_at: expires_at,
               notification_offset_minutes: 0
             } = task1

      assert expires_at == past
    end

    test "returns an empty list if no tasks need to be run" do
      %Skate.Detours.Db.Detour{} =
        detour = :detour |> build |> activated |> insert()

      now = DateTime.utc_now()

      old = DateTime.add(now, -120, :minute)

      %Skate.Detours.Db.DetourExpirationTask{} =
        :detour_expiration_task
        |> build(detour: detour)
        |> expires(old)
        |> completed()
        |> insert()

      [] = NotificationScheduler.tasks_ready_to_run()
    end
  end

  describe "create_detour_expiration_notification_from_task" do
    test "handles back-dating notification to expected event time" do
      %Skate.Detours.Db.Detour{} =
        detour = :detour |> build |> activated |> insert()

      now = DateTime.utc_now()

      %DetourExpirationTask{} =
        task =
        :detour_expiration_task
        |> build(
          detour: detour,
          expires_at: DateTime.add(now, -60, :minute),
          notification_offset_minutes: 30
        )
        |> insert()

      created_at_offset_backdated =
        task.expires_at
        |> DateTime.shift(minute: -task.notification_offset_minutes)
        |> DateTime.truncate(:second)

      assert :eq =
               DateTime.compare(
                 created_at_offset_backdated,
                 now |> DateTime.truncate(:second) |> DateTime.shift(minute: -90)
               )

      created_at_unix = DateTime.to_unix(created_at_offset_backdated)

      assert {:ok, %{notification: %{created_at: ^created_at_unix}}} =
               NotificationScheduler.create_detour_expiration_notification_from_task(task)
    end
  end
end
