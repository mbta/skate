Application.ensure_all_started(:stream_data)
Skate.Migrate.migrate()
ExUnit.start(capture_log: true)
