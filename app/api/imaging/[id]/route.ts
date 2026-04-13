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

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // 1. Fetch the imaging study to get image URLs
        const { data: study, error: fetchError } = await supabase
            .from("imagingstudies")
            .select("thumbnail")
            .eq("id", id)
            .single()

        if (fetchError || !study) {
            console.error("Fetch error or study not found:", fetchError)
            return NextResponse.json({ error: "Imaging study not found" }, { status: 404 })
        }

        // 2. Parse image paths from thumbnail/urls
        let imagePaths: string[] = []
        try {
            const parsed = JSON.parse(study.thumbnail || "[]")
            const urls = Array.isArray(parsed) ? parsed : [study.thumbnail].filter(Boolean)

            // Extract the path after /public/uploads/ from the URL
            // Format: https://project.supabase.co/storage/v1/object/public/uploads/patients/0112/filename.jpg
            imagePaths = urls.map((url: string) => {
                const parts = url.split("/public/uploads/")
                return parts.length > 1 ? parts[1] : null
            }).filter(Boolean) as string[]
        } catch {
            // If thumbnail is just a single string URL
            if (study.thumbnail && study.thumbnail.includes("/public/uploads/")) {
                const parts = study.thumbnail.split("/public/uploads/")
                if (parts.length > 1) imagePaths.push(parts[1])
            }
        }

        // 3. Delete files from Supabase Storage (S3)
        if (imagePaths.length > 0) {
            for (const path of imagePaths) {
                try {
                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: "uploads",
                        Key: path,
                    }))
                    console.log(`Successfully deleted file from storage: ${path}`)
                } catch (s3Error) {
                    console.error(`Failed to delete file from storage: ${path}`, s3Error)
                    // We continue even if storage deletion fails
                }
            }
        }

        // 4. Delete the record from the database
        const { error: deleteError } = await supabase
            .from("imagingstudies")
            .delete()
            .eq("id", id)

        if (deleteError) {
            console.error("Database delete error:", deleteError)
            return NextResponse.json({ error: "Failed to delete imaging study" }, { status: 500 })
        }

        return NextResponse.json({ message: "Imaging study and associated images deleted successfully" })
    } catch (error: any) {
        console.error("Failed to delete imaging study:", error)
        return NextResponse.json({
            error: "Failed to delete imaging study",
            details: error.message || "Unknown error"
        }, { status: 500 })
    }
}
