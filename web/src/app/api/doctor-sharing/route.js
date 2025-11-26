import sql from "@/app/api/utils/sql";
import { sendEmail } from "@/app/api/utils/send-email";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      user_id,
      doctor_email,
      doctor_name,
      access_level = "basic",
      expires_in_days = 30,
    } = body;

    if (!user_id || !doctor_email || !doctor_name) {
      return Response.json(
        { error: "user_id, doctor_email, and doctor_name required" },
        { status: 400 },
      );
    }

    // Calculate expiry date
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + expires_in_days);

    // Check if access already exists
    const existingAccess = await sql`
      SELECT * FROM doctor_access 
      WHERE user_id = ${user_id} AND doctor_email = ${doctor_email}
    `;

    let doctorAccess;

    if (existingAccess.length > 0) {
      // Update existing access
      doctorAccess = await sql`
        UPDATE doctor_access 
        SET doctor_name = ${doctor_name}, 
            access_level = ${access_level}, 
            expires_at = ${expires_at},
            access_granted = true,
            granted_at = NOW()
        WHERE user_id = ${user_id} AND doctor_email = ${doctor_email}
        RETURNING *
      `;
    } else {
      // Create new access
      doctorAccess = await sql`
        INSERT INTO doctor_access (
          user_id, doctor_email, doctor_name, access_level, 
          access_granted, expires_at, granted_at
        ) VALUES (
          ${user_id}, ${doctor_email}, ${doctor_name}, ${access_level},
          true, ${expires_at}, NOW()
        ) RETURNING *
      `;
    }

    // Get user information for the email
    const user = await sql`SELECT * FROM users WHERE id = ${user_id}`;

    if (user.length === 0) {
      throw new Error("User not found");
    }

    // Generate secure access token (simple version - in production use proper JWT)
    const accessToken = Buffer.from(
      `${user_id}:${doctor_email}:${Date.now()}`,
    ).toString("base64");

    // Create access URL
    const accessUrl = `${process.env.APP_URL}/doctor-access?token=${accessToken}&user_id=${user_id}`;

    // Send email to doctor with access link
    try {
      await sendEmail({
        to: doctor_email,
        subject: `Health Data Access Request from ${user[0].name}`,
        html: `
          <h2>Health Data Access Granted</h2>
          <p>Hello Dr. ${doctor_name},</p>
          <p>${user[0].name} has granted you access to their hypertension management data.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Access Details:</h3>
            <p><strong>Patient:</strong> ${user[0].name}</p>
            <p><strong>Access Level:</strong> ${access_level}</p>
            <p><strong>Valid Until:</strong> ${expires_at.toLocaleDateString()}</p>
          </div>
          
          <p>Click the button below to access their health dashboard:</p>
          <a href="${accessUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0;">
            View Patient Data
          </a>
          
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            This link will expire on ${expires_at.toLocaleDateString()}. If you need continued access, please contact your patient.
          </p>
          
          <hr style="margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">
            This email contains confidential patient health information. Please handle according to HIPAA/medical privacy guidelines.
          </p>
        `,
        text: `
Health Data Access Granted

Hello Dr. ${doctor_name},

${user[0].name} has granted you access to their hypertension management data.

Access Details:
- Patient: ${user[0].name}
- Access Level: ${access_level}
- Valid Until: ${expires_at.toLocaleDateString()}

Access URL: ${accessUrl}

This link will expire on ${expires_at.toLocaleDateString()}.
        `,
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      // Don't fail the API call if email fails
    }

    return Response.json({
      success: true,
      doctor_access: doctorAccess[0],
      access_url: accessUrl,
      message: "Doctor access granted successfully",
    });
  } catch (error) {
    console.error("Doctor sharing error:", error);
    return Response.json(
      {
        error: "Failed to grant doctor access",
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
    const token = url.searchParams.get("token");

    if (!user_id) {
      return Response.json({ error: "user_id required" }, { status: 400 });
    }

    // If token is provided, validate doctor access
    if (token) {
      try {
        const decoded = Buffer.from(token, "base64").toString("ascii");
        const [tokenUserId, doctorEmail] = decoded.split(":");

        if (tokenUserId !== user_id) {
          return Response.json(
            { error: "Invalid access token" },
            { status: 403 },
          );
        }

        // Verify doctor access is still valid
        const doctorAccess = await sql`
          SELECT * FROM doctor_access 
          WHERE user_id = ${user_id} AND doctor_email = ${doctorEmail}
          AND access_granted = true AND expires_at > NOW()
        `;

        if (doctorAccess.length === 0) {
          return Response.json(
            { error: "Access expired or not found" },
            { status: 403 },
          );
        }

        // Return patient data for doctor
        const [user, bpReadings, medications, symptoms] = await sql.transaction(
          [
            sql`SELECT name, age, target_systolic, target_diastolic FROM users WHERE id = ${user_id}`,
            sql`SELECT * FROM bp_readings WHERE user_id = ${user_id} ORDER BY reading_time DESC LIMIT 50`,
            sql`SELECT * FROM medications WHERE user_id = ${user_id} AND active = true`,
            sql`SELECT * FROM symptom_logs WHERE user_id = ${user_id} ORDER BY logged_at DESC LIMIT 20`,
          ],
        );

        return Response.json({
          patient_info: user[0],
          bp_readings: bpReadings,
          medications: medications,
          symptoms: symptoms,
          doctor_access: doctorAccess[0],
        });
      } catch (tokenError) {
        return Response.json(
          { error: "Invalid access token format" },
          { status: 400 },
        );
      }
    }

    // Regular user request - get their shared accesses
    const doctorAccesses = await sql`
      SELECT * FROM doctor_access 
      WHERE user_id = ${user_id}
      ORDER BY granted_at DESC
    `;

    return Response.json({ doctor_accesses: doctorAccesses });
  } catch (error) {
    console.error("Get doctor sharing error:", error);
    return Response.json(
      { error: "Failed to get doctor access" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get("user_id");
    const doctor_email = url.searchParams.get("doctor_email");

    if (!user_id || !doctor_email) {
      return Response.json(
        { error: "user_id and doctor_email required" },
        { status: 400 },
      );
    }

    // Revoke doctor access
    await sql`
      UPDATE doctor_access 
      SET access_granted = false
      WHERE user_id = ${user_id} AND doctor_email = ${doctor_email}
    `;

    return Response.json({
      success: true,
      message: "Doctor access revoked successfully",
    });
  } catch (error) {
    console.error("Revoke doctor access error:", error);
    return Response.json(
      { error: "Failed to revoke doctor access" },
      { status: 500 },
    );
  }
}
