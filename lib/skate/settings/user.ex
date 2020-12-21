defmodule Skate.Settings.User do
  alias Skate.Settings.Db.RouteSettings, as: DbRouteSettings
  alias Skate.Settings.Db.User, as: DbUser

  import Ecto.Query

  def get_or_create(username) do
    Skate.Repo.insert!(
      DbUser.changeset(%DbUser{}, %{username: username}),
      returning: true,
      conflict_target: [:username],
      # update a row with no effect so the returning works
      on_conflict: {:replace, [:username]}
    )
  end

  def usernames_for_route_ids(route_ids) do
    Skate.Repo.all(
      from(rs in DbRouteSettings,
        join: u in assoc(rs, :user),
        where: fragment("?::varchar[] && ?", ^route_ids, rs.selected_route_ids),
        select: u.username
      )
    )
  end
end
