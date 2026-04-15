import { NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getAuthSession } from "@/lib/auth"
import { s3Client } from "@/lib/s3"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const bucket = "uploads"
    const safeName = file.name.replace(/[^\w.-]/g, "-")
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const key = `profiles/${session.id}/${uniqueSuffix}-${safeName}`

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    )

    const imageUrl = `/api/storage/${bucket}/${key}`

    const { error: userError } = await supabaseAdmin
      .from("users")
      .update({ image: imageUrl })
      .eq("id", session.id)

    if (userError) {
      if (userError.message?.includes("column users.image does not exist")) {
        return NextResponse.json(
          {
            error: "Database migration required: users.image column is missing",
            details: "Please add the image column to users table and retry.",
          },
          { status: 500 }
        )
      }
      return NextResponse.json({ error: userError.message || "Failed to update user image" }, { status: 500 })
    }

    if (session.role === "DOCTOR") {
      const doctorUpdate = supabaseAdmin.from("doctors").update({ image: imageUrl })
      if (session.doctor_id) {
        await doctorUpdate.eq("id", session.doctor_id)
      } else {
        await doctorUpdate.eq("email", session.email.trim().toLowerCase())
      }
    }

    return NextResponse.json({ success: true, imageUrl }, { status: 200 })
  } catch (error: any) {
    console.error("[POST /api/auth/profile/image] Error:", error)
    return NextResponse.json(
      { error: "Failed to upload profile image", details: error?.message || "Unknown error" },
      { status: 500 }
    )
  }
}
