defmodule Skate.PushSpikeServer do
  def subscribe(username, endpoint, auth_key, p256dh_key) do
    Task.start(fn ->
      subscription = %{keys: %{p256dh: p256dh_key, auth: auth_key}, endpoint: endpoint}

      payload = %{
        "username" => username,
        "n_shuttles" => length(Realtime.Server.subscribe_to_all_shuttles())
      }

      {:ok, _response} =
        WebPushEncryption.send_web_push(Jason.encode!(payload), subscription)
        |> IO.inspect(label: "PUSH RESULT")
    end)
  end
end
