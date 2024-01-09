Application.ensure_all_started(:stream_data)
{:ok, _} = Application.ensure_all_started(:ex_machina)
ExUnit.start(capture_log: true)

Mox.defmock(Skate.OpenRouteServiceAPI.MockClient, for: Skate.OpenRouteServiceAPI.Client)

Application.put_env(:skate, Skate.OpenRouteServiceAPI,
  client: Skate.OpenRouteServiceAPI.MockClient
)
