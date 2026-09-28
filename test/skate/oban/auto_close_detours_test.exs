defmodule Skate.Oban.AutoCloseDetoursTest do
  use Skate.DataCase
  use Oban.Testing, repo: Skate.Repo

  import Skate.Factory
  require Mox

  alias Skate.Detours.Db.Detour
  alias Skate.Oban.AutoCloseDetours
  alias Skate.Repo

  setup do
    Mox.expect(ExAws.Request.HttpMock, :request, fn _, _, _, _, _ ->
      {:ok, %{status_code: 200, body: ""}}
    end)

    Mox.verify_on_exit!()
    :ok
  end

  test "marks expired active detours past and safely ignores future or already-closed detours" do
    now = DateTime.utc_now()
    expired_at = DateTime.add(now, -60, :second)
    future_at = DateTime.add(now, 60, :second)

    expired_detour =
      :detour
      |> build()
      |> activated(DateTime.add(now, -3_600, :second))
      |> with_autoclose_on(expired_at)
      |> insert()

    future_detour =
      :detour
      |> build()
      |> activated()
      |> with_autoclose_on(future_at)
      |> insert()

    manually_closed_detour =
      :detour
      |> build()
      |> activated()
      |> with_autoclose_on(expired_at)
      |> deactivated()
      |> insert()

    assert {:ok, 1} = perform_job(AutoCloseDetours, %{})
    assert Repo.get!(Detour, expired_detour.id).status == :past
    assert Repo.get!(Detour, future_detour.id).status == :active
    assert Repo.get!(Detour, manually_closed_detour.id).status == :past

    assert {:ok, 0} = perform_job(AutoCloseDetours, %{})
  end
end
