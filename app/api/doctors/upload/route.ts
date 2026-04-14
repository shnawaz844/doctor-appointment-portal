import { NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getAuthSession } from "@/lib/auth"

const s3Client = new S3Client({
    forcePathStyle: true,
    region: process.env.SUPABASE_S3_REGION || "ap-southeast-1",
    endpoint: process.env.SUPABASE_S3_ENDPOINT,
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
        const bucket = "uploads" // Using the existing uploads bucket

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Generate a unique filename and path in the doctors folder
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
        const filename = `${uniqueSuffix}-${file.name.replace(/\s+/g, '-')}`
        const path = `doctors/${filename}`

        const putCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: path,
            Body: buffer,
            ContentType: file.type,
        })

        await s3Client.send(putCommand)

        // Generate the proxy URL
        const proxyUrl = `/api/storage/${bucket}/${path}`

        return NextResponse.json({ 
            success: true,
            url: proxyUrl, 
            path: `${bucket}/${path}`,
            filename: file.name
        }, { status: 200 })
        
    } catch (error: any) {
        console.error("[POST /api/doctors/upload] Error:", error)
        return NextResponse.json({
            error: "Failed to process upload",
            details: error.message || "Unknown error"
        }, { status: 500 })
    }
}
