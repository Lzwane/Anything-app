import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json();
    const { image_base64, user_id, meal_type, description } = body;

    if (!image_base64 || !user_id) {
      return Response.json(
        { error: "Image and user_id required" },
        { status: 400 },
      );
    }

    // Analyze food image with GPT Vision
    const visionResponse = await fetch("/integrations/gpt-vision/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this food image for a hypertension patient. Provide: 1) List of foods identified, 2) Estimated sodium content (low/medium/high), 3) Healthiness rating (1-10, 10=excellent for BP), 4) Brief recommendations for hypertension management. Format as JSON with keys: foods, sodium_level, health_rating, recommendations, estimated_sodium_mg, estimated_calories",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image_base64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!visionResponse.ok) {
      throw new Error("Vision analysis failed");
    }

    const visionData = await visionResponse.json();
    let analysis = {};

    try {
      // Try to parse JSON response from AI
      const content = visionData.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if not JSON format
        analysis = {
          foods: "Unable to identify",
          sodium_level: "unknown",
          health_rating: 5,
          recommendations: content,
          estimated_sodium_mg: null,
          estimated_calories: null,
        };
      }
    } catch (parseError) {
      analysis = {
        foods: "Analysis completed",
        sodium_level: "unknown",
        health_rating: 5,
        recommendations: visionData.choices[0].message.content,
        estimated_sodium_mg: null,
        estimated_calories: null,
      };
    }

    // Store food log in database
    const foodLog = await sql`
      INSERT INTO food_logs (
        user_id, meal_type, food_description, sodium_content, 
        calories, image_url, logged_at
      ) VALUES (
        ${user_id}, ${meal_type || "unknown"}, ${description || analysis.foods},
        ${analysis.estimated_sodium_mg}, ${analysis.estimated_calories},
        'data:image/jpeg;base64,processed', NOW()
      ) RETURNING *
    `;

    return Response.json({
      success: true,
      food_log: foodLog[0],
      analysis: {
        foods: analysis.foods,
        sodium_level: analysis.sodium_level,
        health_rating: analysis.health_rating,
        recommendations: analysis.recommendations,
        estimated_sodium_mg: analysis.estimated_sodium_mg,
        estimated_calories: analysis.estimated_calories,
      },
    });
  } catch (error) {
    console.error("Food analysis error:", error);
    return Response.json(
      {
        error: "Failed to analyze food",
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
    const limit = url.searchParams.get("limit") || 50;

    if (!user_id) {
      return Response.json({ error: "user_id required" }, { status: 400 });
    }

    const foodLogs = await sql`
      SELECT * FROM food_logs 
      WHERE user_id = ${user_id}
      ORDER BY logged_at DESC
      LIMIT ${limit}
    `;

    return Response.json({ food_logs: foodLogs });
  } catch (error) {
    console.error("Get food logs error:", error);
    return Response.json({ error: "Failed to get food logs" }, { status: 500 });
  }
}
