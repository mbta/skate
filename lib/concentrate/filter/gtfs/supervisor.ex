defmodule Concentrate.Filter.GTFS.Supervisor do
  @moduledoc """
  Supervisor for the extra servers needed for GTFS parsing.

  * HTTP producer to fetch the GTFS file
  * Consumer / map of relevant GTFS data
  """
  @one_hour 3_600_000

  def start_link(config) do
    if config[:url] do
      Supervisor.start_link(
        [
          {
            Concentrate.Producer.HTTP,
            {
              config[:url],
              parser: Concentrate.Filter.GTFS.Unzip,
              fetch_after: @one_hour,
              content_warning_timeout: :infinity,
              name: :gtfs_producer
            }
          },
          {Concentrate.Filter.GTFS.Trips, subscribe_to: [:gtfs_producer]},
          {Concentrate.Filter.GTFS.Stops, subscribe_to: [:gtfs_producer]},
          {Concentrate.Filter.GTFS.PickupDropOff, subscribe_to: [:gtfs_producer]}
        ],
        strategy: :rest_for_one
      )
    else
      :ignore
    end
  end

  def child_spec(opts) do
    %{
      id: __MODULE__,
      start: {__MODULE__, :start_link, [opts]},
      type: :supervisor
    }
  end
end
