import { NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const OPD_API_KEY = process.env.OPD_API_KEY || "doctor-portal-secure-2026"

const s3Client = new S3Client({
    forcePathStyle: true,
    region: process.env.SUPABASE_S3_REGION || "ap-northeast-1",
    endpoint: process.env.SUPABASE_S3_ENDPOINT || "https://ovfntwpehxejgwtcpifu.storage.supabase.co/storage/v1/s3",
    credentials: {
        accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY || "",
        secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY || "",
    }
})

function validateApiKey(request: Request): boolean {
    const key = request.headers.get("x-api-key")
    return key === OPD_API_KEY
}

export async function POST(request: Request) {
    try {
        if (!validateApiKey(request)) {
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
        // Safety check for file.name
        const originalName = file.name || "document"
        const safeName = originalName.replace(/\s+/g, '-')
        const filename = `${uniqueSuffix}-${safeName}`
        const path = `patients/${patientId}/${filename}`

        const putCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: path,
            Body: buffer,
            ContentType: file.type || "application/octet-stream",
        })

        try {
            await s3Client.send(putCommand)
        } catch (error: any) {
            console.error("Supabase S3 Upload Error Details:", {
                message: error.message,
                code: error.code,
                requestId: error.$metadata?.requestId,
                bucket: bucket,
                path: path
            })
            return NextResponse.json({ 
                error: "Failed to upload file to Supabase S3", 
                details: error.message,
                bucket,
                path
            }, { status: 500 })
        }

        // Generate secure internal proxy URL instead of public URL
        const proxyUrl = `/api/storage/${bucket}/${path}`

        return NextResponse.json({
            success: true,
            url: proxyUrl,
            path: `${bucket}/${path}`,
            filename: originalName
        }, { status: 200 })

    } catch (error: any) {
        console.error("[POST /api/opd-online/upload] Error:", error)
        return NextResponse.json({
            error: "Failed to process upload",
            details: error.message || "Unknown error",
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 })
    }
}
