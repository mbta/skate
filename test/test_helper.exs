Application.ensure_all_started(:stream_data)
{:ok, _} = Application.ensure_all_started(:ex_machina)
ExUnit.start(capture_log: true)
