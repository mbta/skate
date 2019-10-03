defmodule Realtime.Supervisor do
  use Supervisor

  def start_link([]) do
    Supervisor.start_link(__MODULE__, :ok)
  end

  @impl true
  def init(:ok) do
    children = [
      {Registry, keys: :duplicate, name: Realtime.Server.registry_name()},
      {Realtime.Server, name: Realtime.Server.default_name()},
      {Concentrate.Supervisor,
       [
         busloc_url: Application.get_env(:skate, :busloc_url),
         swiftly_authorization_key: Application.get_env(:skate, :swiftly_authorization_key),
         swiftly_realtime_vehicles_url:
           Application.get_env(:skate, :swiftly_realtime_vehicles_url)
       ]}
    ]

    Supervisor.init(children, strategy: :one_for_all)
  end
end
