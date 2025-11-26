import sql from "@/app/api/utils/sql";
import { sendEmail } from "@/app/api/utils/send-email";

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, reminder_method = "email", test_send = false } = body;

    if (!user_id) {
      return Response.json({ error: "user_id required" }, { status: 400 });
    }

    // Get user info
    const user = await sql`SELECT * FROM users WHERE id = ${user_id}`;
    if (user.length === 0) {
      throw new Error("User not found");
    }

    // Get active medications with reminders
    const medications = await sql`
      SELECT * FROM medications 
      WHERE user_id = ${user_id} AND active = true 
      AND reminder_times IS NOT NULL
    `;

    if (medications.length === 0) {
      return Response.json({
        message: "No active medications with reminders found",
        reminders_sent: 0,
      });
    }

    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

    let remindersToSend = [];

    // Find medications that need reminders now (within 15 minutes)
    for (const medication of medications) {
      if (medication.reminder_times) {
        for (const reminderTime of medication.reminder_times) {
          const [reminderHour, reminderMinute] = reminderTime
            .split(":")
            .map(Number);
          const timeDiff = Math.abs(
            currentHour * 60 +
              currentMinute -
              (reminderHour * 60 + reminderMinute),
          );

          // Send reminder if within 15 minutes or if test_send is true
          if (timeDiff <= 15 || test_send) {
            remindersToSend.push({
              medication,
              reminder_time: reminderTime,
            });
          }
        }
      }
    }

    let sentCount = 0;
    const results = [];

    for (const reminder of remindersToSend) {
      try {
        if (reminder_method === "email" && user[0].email) {
          await sendEmail({
            to: user[0].email,
            subject: `💊 Medication Reminder - ${reminder.medication.medication_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">💊 Medication Reminder</h2>
                
                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #1e40af;">Time to take your medication!</h3>
                  <p><strong>Medication:</strong> ${reminder.medication.medication_name}</p>
                  <p><strong>Dosage:</strong> ${reminder.medication.dosage}</p>
                  <p><strong>Scheduled Time:</strong> ${reminder.reminder_time}</p>
                  ${reminder.medication.notes ? `<p><strong>Notes:</strong> ${reminder.medication.notes}</p>` : ""}
                </div>
                
                <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0;">
                  <h4 style="margin-top: 0; color: #92400e;">⚠️ Important Reminders:</h4>
                  <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                    <li>Take with food if recommended by your doctor</li>
                    <li>Don't skip doses to maintain consistent blood pressure control</li>
                    <li>Contact your doctor if you experience side effects</li>
                  </ul>
                </div>
                
                <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                  This is an automated reminder from your Hypertension Management App. 
                  If you've already taken this medication, you can ignore this message.
                </p>
                
                <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 6px;">
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                    Consistent medication adherence is crucial for managing your blood pressure. 
                    Keep up the great work taking care of your health! 💪
                  </p>
                </div>
              </div>
            `,
            text: `
Medication Reminder

Time to take your medication!

Medication: ${reminder.medication.medication_name}
Dosage: ${reminder.medication.dosage}
Scheduled Time: ${reminder.reminder_time}
${reminder.medication.notes ? `Notes: ${reminder.medication.notes}` : ""}

Important: Don't skip doses to maintain consistent blood pressure control.
            `,
          });

          sentCount++;
          results.push({
            medication: reminder.medication.medication_name,
            time: reminder.reminder_time,
            method: "email",
            status: "sent",
          });
        }

        // Note: SMS and WhatsApp would require additional integrations
        // For now, we're focusing on email reminders
      } catch (emailError) {
        console.error("Reminder email failed:", emailError);
        results.push({
          medication: reminder.medication.medication_name,
          time: reminder.reminder_time,
          method: reminder_method,
          status: "failed",
          error: emailError.message,
        });
      }
    }

    return Response.json({
      success: true,
      reminders_sent: sentCount,
      total_medications_checked: medications.length,
      reminders_due: remindersToSend.length,
      results: results,
      message: test_send
        ? `Test reminders sent for ${sentCount} medications`
        : `${sentCount} medication reminders sent successfully`,
    });
  } catch (error) {
    console.error("Medication reminder error:", error);
    return Response.json(
      {
        error: "Failed to send medication reminders",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get("user_id");

    if (!user_id) {
      return Response.json({ error: "user_id required" }, { status: 400 });
    }

    // Get upcoming reminders for today
    const medications = await sql`
      SELECT * FROM medications 
      WHERE user_id = ${user_id} AND active = true 
      AND reminder_times IS NOT NULL
    `;

    const today = new Date();
    const upcomingReminders = [];

    for (const medication of medications) {
      if (medication.reminder_times) {
        for (const reminderTime of medication.reminder_times) {
          const [hour, minute] = reminderTime.split(":").map(Number);
          const reminderDateTime = new Date(today);
          reminderDateTime.setHours(hour, minute, 0, 0);

          // Check if already taken today
          const takenToday = await sql`
            SELECT * FROM medication_logs 
            WHERE medication_id = ${medication.id} 
            AND user_id = ${user_id}
            AND DATE(taken_at) = CURRENT_DATE
            AND taken = true
          `;

          upcomingReminders.push({
            medication_id: medication.id,
            medication_name: medication.medication_name,
            dosage: medication.dosage,
            reminder_time: reminderTime,
            reminder_datetime: reminderDateTime,
            already_taken: takenToday.length > 0,
            is_overdue: reminderDateTime < new Date(),
            notes: medication.notes,
          });
        }
      }
    }

    // Sort by time
    upcomingReminders.sort((a, b) => a.reminder_datetime - b.reminder_datetime);

    return Response.json({
      upcoming_reminders: upcomingReminders,
      total_for_today: upcomingReminders.length,
      taken_count: upcomingReminders.filter((r) => r.already_taken).length,
      overdue_count: upcomingReminders.filter(
        (r) => r.is_overdue && !r.already_taken,
      ).length,
    });
  } catch (error) {
    console.error("Get reminders error:", error);
    return Response.json({ error: "Failed to get reminders" }, { status: 500 });
  }
}
