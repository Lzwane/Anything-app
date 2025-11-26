import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      user_id,
      steps_count,
      distance_km,
      active_minutes,
      calories_burned,
      date,
    } = body;

    if (!user_id || steps_count === undefined) {
      return Response.json(
        { error: "user_id and steps_count required" },
        { status: 400 },
      );
    }

    const activityDate = date ? new Date(date) : new Date();
    const dateString = activityDate.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Check if entry exists for this date
    const existing = await sql`
      SELECT * FROM activity_logs 
      WHERE user_id = ${user_id} AND date = ${dateString}
    `;

    let activityLog;

    if (existing.length > 0) {
      // Update existing entry
      activityLog = await sql`
        UPDATE activity_logs 
        SET steps_count = ${steps_count},
            distance_km = ${distance_km || null},
            active_minutes = ${active_minutes || 0},
            calories_burned = ${calories_burned || null}
        WHERE user_id = ${user_id} AND date = ${dateString}
        RETURNING *
      `;
    } else {
      // Create new entry
      activityLog = await sql`
        INSERT INTO activity_logs (
          user_id, date, steps_count, distance_km, active_minutes, calories_burned
        ) VALUES (
          ${user_id}, ${dateString}, ${steps_count}, ${distance_km || null}, 
          ${active_minutes || 0}, ${calories_burned || null}
        ) RETURNING *
      `;
    }

    // Get user's step goal (default 5000)
    const userGoal = await sql`
      SELECT target_steps FROM users WHERE id = ${user_id}
    `;

    const stepGoal =
      userGoal.length > 0 && userGoal[0].target_steps
        ? userGoal[0].target_steps
        : 5000;
    const goalAchieved = steps_count >= stepGoal;

    return Response.json({
      success: true,
      activity_log: activityLog[0],
      goal_achieved: goalAchieved,
      step_goal: stepGoal,
      completion_percentage: Math.round((steps_count / stepGoal) * 100),
    });
  } catch (error) {
    console.error("Activity tracking error:", error);
    return Response.json(
      {
        error: "Failed to log activity",
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
    const days = url.searchParams.get("days") || 30;
    const date_from = url.searchParams.get("date_from");
    const date_to = url.searchParams.get("date_to");

    if (!user_id) {
      return Response.json({ error: "user_id required" }, { status: 400 });
    }

    let query;
    let params = [user_id];

    if (date_from && date_to) {
      // Custom date range
      query = `
        SELECT * FROM activity_logs 
        WHERE user_id = $1 AND date BETWEEN $2 AND $3
        ORDER BY date DESC
      `;
      params = [user_id, date_from, date_to];
    } else {
      // Last N days
      query = `
        SELECT * FROM activity_logs 
        WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
        ORDER BY date DESC
      `;
    }

    const activityLogs = await sql(query, params);

    // Get user's step goal
    const userGoal = await sql`
      SELECT target_steps FROM users WHERE id = ${user_id}
    `;

    const stepGoal =
      userGoal.length > 0 && userGoal[0].target_steps
        ? userGoal[0].target_steps
        : 5000;

    // Calculate statistics
    const totalSteps = activityLogs.reduce(
      (sum, log) => sum + (log.steps_count || 0),
      0,
    );
    const averageSteps =
      activityLogs.length > 0
        ? Math.round(totalSteps / activityLogs.length)
        : 0;
    const daysWithGoal = activityLogs.filter(
      (log) => log.steps_count >= stepGoal,
    ).length;
    const goalAchievementRate =
      activityLogs.length > 0
        ? Math.round((daysWithGoal / activityLogs.length) * 100)
        : 0;

    // Fill in missing days with 0 steps for consistent charting
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (parseInt(days) - 1));

    const completeData = [];
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split("T")[0];
      const existingLog = activityLogs.find((log) => log.date === dateString);

      completeData.push({
        date: dateString,
        steps_count: existingLog ? existingLog.steps_count : 0,
        distance_km: existingLog ? existingLog.distance_km : null,
        active_minutes: existingLog ? existingLog.active_minutes : 0,
        calories_burned: existingLog ? existingLog.calories_burned : null,
        goal_achieved: existingLog
          ? existingLog.steps_count >= stepGoal
          : false,
      });
    }

    return Response.json({
      activity_logs: completeData.reverse(), // Most recent first
      statistics: {
        total_steps: totalSteps,
        average_steps: averageSteps,
        days_with_goal: daysWithGoal,
        goal_achievement_rate: goalAchievementRate,
        step_goal: stepGoal,
        days_tracked: activityLogs.length,
      },
    });
  } catch (error) {
    console.error("Get activity tracking error:", error);
    return Response.json(
      { error: "Failed to get activity logs" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { user_id, step_goal } = body;

    if (!user_id || !step_goal) {
      return Response.json(
        { error: "user_id and step_goal required" },
        { status: 400 },
      );
    }

    // Update user's step goal
    await sql`
      UPDATE users 
      SET target_steps = ${step_goal}
      WHERE id = ${user_id}
    `;

    return Response.json({
      success: true,
      step_goal: step_goal,
      message: "Step goal updated successfully",
    });
  } catch (error) {
    console.error("Update step goal error:", error);
    return Response.json(
      {
        error: "Failed to update step goal",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
