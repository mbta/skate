defmodule Report.UserInfoTest do
  use Skate.DataCase

  alias Skate.Settings.User

  describe "run/0" do
    test "returns database contents" do
      username = "username"

      user = User.upsert(username, "user@test.com")

      {:ok, result} = Report.UserInfo.run()

      assert result == [
               %{
                 "id" => user.id,
                 "username" => username,
                 "uuid" => user.uuid,
                 "email" => user.email
               }
             ]
    end
  end

  describe "short_name/0" do
    test "returns short name" do
      assert Report.UserInfo.short_name() == "user_info"
    end
  end

  describe "description/0" do
    test "returns description" do
      assert Report.UserInfo.description() == "User Info"
    end
  end
end
