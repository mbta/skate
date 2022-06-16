defmodule Skate.Settings.User do
  alias Skate.Settings.Db.User, as: DbUser

  import Ecto.Query

  def get_or_create(username) do
    user =
      Skate.Repo.insert!(
        DbUser.changeset(%DbUser{}, %{username: username}),
        returning: true,
        conflict_target: [:username],
        # update a row with no effect so the returning works
        on_conflict: {:replace, [:username]}
      )

    if is_nil(user.uuid) do
      user |> Ecto.Changeset.change(%{uuid: Ecto.UUID.generate()}) |> Skate.Repo.update!()
    else
      user
    end
  end

  def user_ids_for_route_ids(route_ids) do
    Skate.Repo.all(from(u in users_for_route_ids_query(route_ids), select: u.id))
  end

  def usernames_for_route_ids(route_ids) do
    Skate.Repo.all(from(u in users_for_route_ids_query(route_ids), select: u.username))
  end

  defp users_for_route_ids_query(route_ids) do
    from(u in DbUser,
      join: rt in assoc(u, :route_tabs),
      # non-nil ordering means tab is open
      where:
        not is_nil(rt.ordering) and
          fragment("?::varchar[] && ?", ^route_ids, rt.selected_route_ids)
    )
  end
end
