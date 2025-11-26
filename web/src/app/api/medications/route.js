import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      user_id,
      medication_name,
      dosage,
      frequency,
      times_per_day,
      reminder_times,
      prescribing_doctor,
      start_date,
      end_date,
      notes,
    } = body;

    if (!user_id || !medication_name) {
      return Response.json(
        { error: "User ID and medication name are required" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO medications (
        user_id, medication_name, dosage, frequency, times_per_day,
        reminder_times, prescribing_doctor, start_date, end_date, notes
      ) 
      VALUES (
        ${user_id}, ${medication_name}, ${dosage}, ${frequency}, ${times_per_day},
        ${reminder_times}, ${prescribing_doctor}, ${start_date}, ${end_date}, ${notes}
      )
      RETURNING *
    `;

    return Response.json({ success: true, medication: result[0] });
  } catch (error) {
    console.error("Error creating medication:", error);
    return Response.json(
      { error: "Failed to create medication" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const active_only = searchParams.get("active_only") === "true";

    if (!user_id) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    let whereClause = "WHERE user_id = $1";
    let params = [user_id];

    if (active_only) {
      whereClause += " AND active = true";
    }

    const medications = await sql(
      `
      SELECT * FROM medications 
      ${whereClause}
      ORDER BY medication_name
    `,
      params,
    );

    return Response.json({ medications });
  } catch (error) {
    console.error("Error fetching medications:", error);
    return Response.json(
      { error: "Failed to fetch medications" },
      { status: 500 },
    );
  }
}
