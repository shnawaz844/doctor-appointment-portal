import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
    forcePathStyle: true,
    region: process.env.SUPABASE_S3_REGION || "ap-northeast-1",
    endpoint: process.env.SUPABASE_S3_ENDPOINT || "https://ovfntwpehxejgwtcpifu.storage.supabase.co/storage/v1/s3",
    credentials: {
        accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY || "",
        secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY || "",
    }
})

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const { data: updatedRecord, error } = await supabase
            .from("medicalrecords")
            .update(body)
            .eq("id", id)
            .select()
            .single()

        if (error) {
            console.error("Supabase update error:", error)
            return NextResponse.json({ error: "Failed to update medical record" }, { status: 500 })
        }

        if (!updatedRecord) {
            return NextResponse.json({ error: "Medical record not found" }, { status: 404 })
        }

        return NextResponse.json(updatedRecord)
    } catch (error) {
        console.error("Failed to update medical record:", error)
        return NextResponse.json({ error: "Failed to update medical record" }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // 1. Fetch the record first to get the attachment path
        const { data: record, error: fetchError } = await supabase
            .from("medicalrecords")
            .select("attachment_url")
            .eq("id", id)
            .single()

        if (fetchError || !record) {
            console.error("Fetch error or record not found during delete:", fetchError)
            return NextResponse.json({ error: "Medical record not found" }, { status: 404 })
        }

        // 2. Delete the associated file from S3 if it exists
        if (record.attachment_url) {
            let storagePath = ""
            
            // Handle new proxy format: /api/storage/uploads/patients/001/file.pdf
            if (record.attachment_url.includes("/api/storage/uploads/")) {
                storagePath = record.attachment_url.split("/api/storage/uploads/")[1]
            } 
            // Handle legacy public format: https://.../public/uploads/patients/001/file.pdf
            else if (record.attachment_url.includes("/public/uploads/")) {
                storagePath = record.attachment_url.split("/public/uploads/")[1]
            }

            if (storagePath) {
                try {
                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: "uploads",
                        Key: storagePath,
                    }))
                    console.log(`Successfully deleted storage file: ${storagePath}`)
                } catch (s3Error) {
                    console.error(`Failed to delete storage file: ${storagePath}`, s3Error)
                }
            }
        }

        // 3. Delete the record from the database
        const { error: deleteError } = await supabase
            .from("medicalrecords")
            .delete()
            .eq("id", id)

        if (deleteError) {
            console.error("Supabase delete error:", deleteError)
            return NextResponse.json({ error: "Failed to delete medical record" }, { status: 500 })
        }

        return NextResponse.json({ message: "Medical record and attachment deleted successfully" })
    } catch (error) {
        console.error("Failed to delete medical record:", error)
        return NextResponse.json({ error: "Failed to delete medical record" }, { status: 500 })
    }
}
