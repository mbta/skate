defmodule Concentrate.Filter.Alert.Supervisor do
  @moduledoc """
  Supervisor for the extra servers needed for alert filtering.

  * HTTP producer to fetch the alerts
  * Consumer / map of relevant alerts
  """
  @one_day 86_400_000

  def start_link(config) do
    if config[:url] do
      Supervisor.start_link(
        [
          {
            Concentrate.Producer.HTTP,
            {
              config[:url],
              parser: Concentrate.Parser.Alerts,
              fetch_after: 10_000,
              content_warning_timeout: @one_day,
              name: :alert_producer
            }
          },
          {Concentrate.Filter.Alert.ClosedStops, subscribe_to: [:alert_producer]},
          {Concentrate.Filter.Alert.CancelledTrips, subscribe_to: [:alert_producer]},
          {Concentrate.Filter.Alert.Shuttles, subscribe_to: [:alert_producer]}
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
