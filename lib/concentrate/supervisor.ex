defmodule Concentrate.Supervisor do
  @moduledoc """
  Supervisor for the Concentrate pipeline.

  Children:
  * one per file we're fetching
  * one to merge multiple files into a single output stream
  * one for each consumer
  """
  use Supervisor

  @type opts :: [
          busloc_url: String.t(),
          swiftly_authorization_key: String.t(),
          swiftly_realtime_vehicles_url: String.t()
        ]

  @spec start_link(opts()) :: Supervisor.on_start()
  def start_link(opts) do
    Supervisor.start_link(__MODULE__, opts)
  end

  @impl true
  def init(opts) do
    sources = sources(opts)
    source_ids = Enum.map(sources, fn source -> source.id end)
    merge = merge(source_ids)
    children = sources ++ [merge]
    Supervisor.init(children, strategy: :rest_for_one)
  end

  def sources(opts) do
    busloc =
      if opts[:busloc_url] do
        source_child(
          :busloc,
          opts[:busloc_url],
          Concentrate.Busloc
        )
      else
        nil
      end

    swiftly =
      if opts[:swiftly_realtime_vehicles_url] && opts[:swiftly_authorization_key] do
        source_child(
          :swiftly,
          opts[:swiftly_realtime_vehicles_url],
          Concentrate.Swiftly,
          headers: %{
            "Authorization" => opts[:swiftly_authorization_key]
          },
          params: %{
            unassigned: "true",
            verbose: "true"
          }
        )
      else
        nil
      end

    busloc_trip_updates =
      if opts[:trip_updates_url] do
        source_child(
          :busloc_trip_updates,
          opts[:trip_updates_url],
          Concentrate.BuslocTripUpdate
        )
      else
        nil
      end

    [busloc, swiftly, busloc_trip_updates]
    |> Enum.reject(&is_nil/1)
  end

  defp source_child(source_id, url, parser, opts \\ []) do
    Supervisor.child_spec(
      {
        Concentrate.Producer.HTTP,
        {url, [name: source_id, parser: parser] ++ opts}
      },
      id: source_id
    )
  end

  defp merge(source_ids) do
    Supervisor.child_spec(
      {
        Concentrate.Merge,
        [name: :merge, sources: source_ids]
      },
      id: :merge
    )
  end
end
