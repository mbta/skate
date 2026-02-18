defmodule Skate.RepoTest do
  use ExUnit.Case, async: false

  describe "add_prod_credentials/2" do
    setup do
      original_hostname = System.get_env("PGHOST")
      original_port = System.get_env("PGPORT")
      original_username = System.get_env("PGUSERNAME")

      System.put_env("PGHOST", "db_server_hostname")
      System.put_env("PGUSERNAME", "my_username")
      System.put_env("PGPORT", "6789")

      on_exit(fn ->
        if original_hostname do
          System.put_env("PGHOST", original_hostname)
        else
          System.delete_env("PGHOST")
        end

        if original_username do
          System.put_env("PGUSERNAME", original_username)
        else
          System.delete_env("PGUSERNAME")
        end

        if original_port do
          System.put_env("PGPORT", original_port)
        else
          System.delete_env("PGPORT")
        end
      end)

      :ok
    end

    test "gets credentials from environment variables, except the temporary password gotten from RDS" do
      mock_auth_token_fn = fn "db_server_hostname", "my_username", 6789, %{} ->
        "temporary_password"
      end

      input_config = [
        username: nil,
        password: nil,
        hostname: nil,
        port: 5432,
        ssl: true
      ]

      expected_output = [
        username: "my_username",
        password: "temporary_password",
        hostname: "db_server_hostname",
        port: 6789,
        ssl: true,
        ssl_opts: [
          cacertfile: "priv/aws-cert-bundle.pem",
          verify: :verify_peer,
          server_name_indication: ~c"db_server_hostname",
          verify_fun:
            {&:ssl_verify_hostname.verify_fun/3, [check_hostname: ~c"db_server_hostname"]}
        ]
      ]

      assert Enum.sort(expected_output) ==
               Enum.sort(Skate.Repo.add_prod_credentials(input_config, mock_auth_token_fn))
    end
  end
end
