import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      user_id,
      symptom_type,
      severity,
      description,
      duration_minutes,
      triggers,
    } = body;

    if (!user_id || !symptom_type || !severity) {
      return Response.json(
        { error: "User ID, symptom type, and severity are required" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO symptom_logs (
        user_id, symptom_type, severity, description, 
        duration_minutes, triggers
      ) 
      VALUES (
        ${user_id}, ${symptom_type}, ${severity}, ${description},
        ${duration_minutes}, ${triggers}
      )
      RETURNING *
    `;

    return Response.json({ success: true, symptom: result[0] });
  } catch (error) {
    console.error("Error creating symptom log:", error);
    return Response.json(
      { error: "Failed to create symptom log" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const limit = searchParams.get("limit") || 20;

    if (!user_id) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    const symptoms = await sql`
      SELECT * FROM symptom_logs 
      WHERE user_id = ${user_id}
      ORDER BY logged_at DESC
      LIMIT ${limit}
    `;

    return Response.json({ symptoms });
  } catch (error) {
    console.error("Error fetching symptom logs:", error);
    return Response.json(
      { error: "Failed to fetch symptom logs" },
      { status: 500 },
    );
  }
}
