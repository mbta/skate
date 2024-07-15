Application.ensure_all_started(:stream_data)
{:ok, _} = Application.ensure_all_started(:ex_machina)

ExUnit.start(
  capture_log: true,
  exclude: [
    # By default for local development, exclude tests that rely on
    # non-essential external services, e.g., MQTT tests
    # Use the CLI argument '--include Test.Integration' to enable these tests
    :"Test.Integration"
  ]
)

Mox.defmock(Skate.OpenRouteServiceAPI.MockClient, for: Skate.OpenRouteServiceAPI.Client)

Application.put_env(:skate, Skate.OpenRouteServiceAPI,
  client: Skate.OpenRouteServiceAPI.MockClient
)

Mox.defmock(Skate.Detours.MockTripModificationPublisher,
  for: Skate.Detours.TripModificationPublisher
)

Application.put_env(
  :skate_web,
  :trip_modification_publisher,
  Skate.Detours.MockTripModificationPublisher
)
