import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      user_id,
      systolic,
      diastolic,
      pulse,
      notes,
      food_consumed,
      activity_before,
      stress_level,
      location,
    } = body;

    if (!user_id || !systolic || !diastolic) {
      return Response.json(
        { error: "User ID, systolic, and diastolic values are required" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO bp_readings (
        user_id, systolic, diastolic, pulse, notes, 
        food_consumed, activity_before, stress_level, location
      ) 
      VALUES (
        ${user_id}, ${systolic}, ${diastolic}, ${pulse}, ${notes},
        ${food_consumed}, ${activity_before}, ${stress_level}, ${location}
      )
      RETURNING *
    `;

    return Response.json({ success: true, reading: result[0] });
  } catch (error) {
    console.error("Error creating BP reading:", error);
    return Response.json(
      { error: "Failed to create BP reading" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const limit = searchParams.get("limit") || 10;

    if (!user_id) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    const readings = await sql`
      SELECT * FROM bp_readings 
      WHERE user_id = ${user_id}
      ORDER BY reading_time DESC
      LIMIT ${limit}
    `;

    return Response.json({ readings });
  } catch (error) {
    console.error("Error fetching BP readings:", error);
    return Response.json(
      { error: "Failed to fetch BP readings" },
      { status: 500 },
    );
  }
}
