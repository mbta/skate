defmodule Skate.Detours.NotificationScheduler.Worker do
  @moduledoc false
  use GenServer

  @doc """
  Start the server and link it
  """
  @default_name __MODULE__
  def start_link(defaults \\ []) do
    name = Keyword.get(defaults, :name, @default_name)
    GenServer.start_link(__MODULE__, defaults, name: name)
  end

  def default_name do
    @default_name
  end

  @impl true
  def init(opts) do
    {:ok, opts}
  end
end
