defmodule Test.Support.Helpers do
  @moduledoc "Test helpers"

  defmacro reassign_env(app, var, value) do
    quote do
      old_value = Application.get_env(unquote(app), unquote(var))
      Application.put_env(unquote(app), unquote(var), unquote(value))

      on_exit(fn ->
        if old_value == nil do
          Application.delete_env(unquote(app), unquote(var))
        else
          Application.put_env(unquote(app), unquote(var), old_value)
        end
      end)
    end
  end

  @doc """
  Utility to merge configuration options into the application env for tests.

  Functions similar to `Config.config` and merges any new options with existing
  options configured via `config/` files.

  Automatically resets configuration back to the previous configuration
  `on_exit`
  """
  def config(application, key, opts) do
    existing_config = get_config!(application)
    ExUnit.Callbacks.on_exit(fn -> put_config(existing_config, application) end)

    merge_config(application, key, opts)
  end

  defp merge_config(application, key, opts) do
    get_config!(application)
    |> Config.__merge__([{key, opts}])
    |> put_config(application)
  end

  defp get_config!(application), do: Application.get_all_env(application)
  defp put_config(config, application), do: Application.put_all_env([{application, config}])

  defmacro set_log_level(log_level) do
    quote do
      old_log_level = Logger.level()

      on_exit(fn ->
        Logger.configure(level: old_log_level)
      end)

      Logger.configure(level: unquote(log_level))
    end
  end
end
