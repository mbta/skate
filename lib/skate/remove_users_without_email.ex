defmodule Skate.RemoveUsersWithoutEmail do
  @moduledoc """
  Removes users from the database who don't have an email associated
  """

  import Ecto.Query
  alias Skate.Repo
  alias Skate.Settings.Db.User

  def run() do
    user_ids_to_delete =
      Repo.all(
        from(user in User,
          where: is_nil(user.email) or user.email == "",
          select: user.id
        )
      )

    Enum.each(user_ids_to_delete, fn user_id ->
      Repo.delete_all(from(user in User, where: user.id == ^user_id))
    end)
  end
end
