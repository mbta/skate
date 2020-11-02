defmodule Skate.Settings.User do
  alias Skate.Settings.Db.User, as: DbUser

  def get_or_create(username) do
    Skate.Repo.insert!(
      DbUser.changeset(%DbUser{}, %{username: username}),
      returning: true,
      conflict_target: [:username],
      # update a row with no effect so the returning works
      on_conflict: {:replace, [:username]}
    )
  end
end
