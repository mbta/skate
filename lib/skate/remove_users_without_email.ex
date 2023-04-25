defmodule Skate.RemoveUsersWithoutEmail do
  @moduledoc """
  Removes users from the database who don't have an email associated
  """

  import Ecto.Query
  alias Skate.Repo
  alias Skate.Settings.Db.User

  def run() do
    Repo.delete_all(
      from(user in User,
        where: is_nil(user.email) or user.email == "",
        select: user.id
      )
    )
  end
end
