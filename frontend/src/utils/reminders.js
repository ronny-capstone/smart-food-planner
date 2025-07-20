import { API_BASE_URL } from "./api";
import { REMINDERS_PATH } from "./paths";

export const saveReminderDismissal = async (
  userId,
  itemId,
  reminderType,
  status = "dont_show_again"
) => {
  try {
    const response = await fetch(`${API_BASE_URL}${REMINDERS_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        user_id: userId,
        item_id: itemId,
        reminder_type: reminderType,
        reminder_date: new Date().toISOString(),
        notified: status,
      }),
    });
    return response.ok;
  } catch (err) {
    return false;
  }
};

export const getDismissedReminders = async (userId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${REMINDERS_PATH}?user_id=${userId}&notified=dont_show_again`,
      {
        credentials: "include",
      }
    );
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (err) {
    return [];
  }
};
