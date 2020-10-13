Application.ensure_all_started(:stream_data)
Skate.Migrate.down()
Skate.Migrate.up()
ExUnit.start(capture_log: true)
