defmodule Skate.RemoveUsersWithoutEmail do
  @shortdoc "Removes users from the database who don't have an email associated"

  import Ecto.Query
  alias Skate.Repo
  alias Skate.Settings.Db.User

  def run() do
    # Get list of primary key `id` of affected users
    from(user in User,
      where: is_nil(user.email) or user.email == "",
      select: user.id
    )
    #  Delete all records from `Skate.Settings.Db.TestGroupUser`
    #  Delete all records from `Skate.Settings.Db.RouteTab`
    #  Delete all records from `Notifications.Db.NotificationUser`
    #  Delete all records from `Notifications.Db.Notification`

  end

end
