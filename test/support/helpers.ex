defmodule Test.Support.Helpers do
  @moduledoc "Test helpers"

  defmacro reassign_env(app, var, value) do
    quote do
      old_value = Application.get_env(unquote(app), unquote(var))
      Application.put_env(unquote(app), unquote(var), unquote(value))

      on_exit(fn ->
        Application.put_env(unquote(app), unquote(var), old_value)
      end)
    end
  end
end
