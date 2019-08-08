defmodule RefreshTokenStore.Store do
  @behaviour Access

  @type t :: %{
          username() => token()
        }
  @type username :: String.t()
  @type token :: String.t()

  defstruct []

  @impl Access
  defdelegate fetch(store, username), to: Map
  @impl Access
  defdelegate pop(store, username), to: Map
  @impl Access
  defdelegate get_and_update(term, key, fun), to: Map

  @spec put_refresh_token(t(), username(), token()) :: t()
  defdelegate put_refresh_token(store, username, token), to: Map, as: :put

  @spec get_refresh_token(t(), username()) :: token() | nil
  defdelegate get_refresh_token(store, username), to: Map, as: :get

  @spec clear_refresh_token(t(), username()) :: t()
  defdelegate clear_refresh_token(store, username), to: Map, as: :delete
end
