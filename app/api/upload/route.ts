import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
    forcePathStyle: true,
    region: process.env.SUPABASE_S3_REGION || "ap-northeast-1",
    endpoint: process.env.SUPABASE_S3_ENDPOINT || "https://ovfntwpehxejgwtcpifu.storage.supabase.co/storage/v1/s3",
    credentials: {
        accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY || "",
        secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY || "",
    }
})

export async function POST(request: Request) {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File
        const bucket = formData.get("bucket") as string || "uploads"
        const patientId = formData.get("patientId") as string || "unknown"

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Generate a unique filename and path by patient
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
        const filename = `${uniqueSuffix}-${file.name.replace(/\s+/g, '-')}`
        const path = `patients/${patientId}/${filename}`

        // Supabase S3 requires specifying the bucket name as part of the path or Bucket param.
        // It behaves like an AWS S3 bucket.
        const commaCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: path,
            Body: buffer,
            ContentType: file.type,
        })

        try {
            await s3Client.send(commaCommand)
        } catch (error: any) {
            console.error("Supabase S3 Upload Error:", error)
            return NextResponse.json({ error: "Failed to upload file to Supabase S3", details: error.message }, { status: 500 })
        }

        // Generate secure internal proxy URL instead of public URL
        const proxyUrl = `/api/storage/${bucket}/${path}`

        return NextResponse.json({ url: proxyUrl, path: `${bucket}/${path}` }, { status: 200 })
    } catch (error: any) {
        console.error("Upload API Error:", error)
        return NextResponse.json({
            error: "Failed to process upload",
            details: error.message || "Unknown error"
        }, { status: 500 })
    }
}
