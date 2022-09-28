defmodule Report.UserNamesAndUuidsTest do
  use Skate.DataCase

  alias Skate.Settings.User

  describe "run/0" do
    test "returns database contents" do
      username = "username"

      user = User.upsert(username)

      {:ok, result} = Report.UserNamesAndUuids.run()

      assert result == [
               %{
                 "username" => username,
                 "uuid" => user.uuid
               }
             ]
    end
  end

  describe "short_name/0" do
    test "returns short name" do
      assert Report.UserNamesAndUuids.short_name() == "user_names_and_uuids"
    end
  end

  describe "description/0" do
    test "returns description" do
      assert Report.UserNamesAndUuids.description() == "Usernames and UUIDs"
    end
  end
end
