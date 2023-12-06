defmodule SkateWeb.Endpoint do
  use Sentry.PlugCapture
  use Phoenix.Endpoint, otp_app: :skate

  socket "/socket", SkateWeb.UserSocket,
    websocket: [check_origin: Application.compile_env(:skate, :websocket_check_origin, false)],
    longpoll: false

  # Serve at "/" the static files from "priv/static" directory.
  #
  # You should set gzip to true if you are running phx.digest
  # when deploying your static files in production.
  plug Plug.Static,
    at: "/",
    from: :skate,
    gzip: false,
    only: ~w(css fonts images js favicon.ico robots.txt)

  # Code reloading can be explicitly enabled under the
  # :code_reloader configuration of your endpoint.
  if code_reloading? do
    socket "/phoenix/live_reload/socket", Phoenix.LiveReloader.Socket
    plug Phoenix.LiveReloader
    plug Phoenix.CodeReloader
  end

  plug Plug.RequestId

  plug Logster.Plugs.Logger

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Sentry.PlugContext
  plug Plug.MethodOverride
  plug Plug.Head

  # The session will be stored in the cookie and signed,
  # this means its contents can be read but not tampered with.
  # Set :encryption_salt if you would also like to encrypt it.
  plug Plug.Session,
    store: :cookie,
    key: "_skate_key",
    signing_salt: "jkUgGkwy"

  plug SkateWeb.Router

  # callback for runtime configuration
  def init(:supervisor, config) do
    secret_key_base = Application.get_env(:skate, :secret_key_base)

    config =
      if secret_key_base do
        Keyword.put(config, :secret_key_base, secret_key_base)
      else
        config[:secret_key_base] || raise "No SECRET_KEY_BASE ENV var!"
        config
      end

    {:ok, config}
  end
end
