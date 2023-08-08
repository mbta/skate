defmodule SkateWeb.Redirect do
  @moduledoc """
  Controller that redirects to the `:external` `opts` when `call/2`-ed.

  ---

  Reference: https://www.viget.com/articles/how-to-redirect-from-the-phoenix-router/
  """
  import Phoenix.Controller, only: [redirect: 2]

  @spec init(Keyword.t()) :: Keyword.t()
  def init([external: _] = opts), do: opts
  def init(_default), do: raise("Missing required external: option in redirect")

  @spec call(Plug.Conn.t(), Keyword.t()) :: Plug.Conn.t()
  def call(conn, external: atom) do
    case allowed_url_from_atom(atom) do
      {:ok, url} -> redirect(conn, external: url)
      {:error, :not_found} -> Plug.Conn.send_resp(conn, :not_found, "URL not found")
    end
  end

  @spec allowed_url_from_atom(atom) :: {:ok, String.t()} | {:error, :not_found}

  @aup_url Application.compile_env(:skate, :acceptable_use_policy)
  defp allowed_url_from_atom(:aup), do: {:ok, @aup_url}

  defp allowed_url_from_atom(_), do: {:error, :not_found}
end
