import { NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getAuthSession } from "@/lib/auth"
import { s3Client } from "@/lib/s3"

export async function POST(request: Request) {
    try {
        const session = await getAuthSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File
        const bucket = "uploads"

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

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
