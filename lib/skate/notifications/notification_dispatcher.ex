defmodule Skate.Notifications.NotificationDispatcher do
  @moduledoc """
  Module responsible for dispatching notifications to subscribers via Phoenix.PubSub.
  """

  require Logger

  def dispatch(subscriptions, _from, payload) do
    {user_ids, message} = payload
    {:notification, notification} = message

    valid_subscriptions =
      subscriptions
      |> Enum.filter(fn {_pid, meta} ->
        user_ids == :all or Enum.member?(user_ids, meta.user_id)
      end)
      |> Enum.uniq_by(fn {_pid, meta} -> meta.user_id end)

    message_sent =
      for {pid, _meta} <- valid_subscriptions do
        send(pid, message)
        :ok
      end

    messages_sent = Enum.count(message_sent)

    Logger.info(fn ->
      "sent notification to subscribers" <>
        " notification_id=#{notification.id}" <>
        " messages_sent=#{messages_sent}" <>
        " total_subscribers=#{Enum.count(subscriptions)}" <>
        case user_ids do
          :all -> " user_match_pattern=#{user_ids}"
          user_ids when is_list(user_ids) -> " user_id_count=#{length(user_ids)}"
        end
    end)
  end
end
