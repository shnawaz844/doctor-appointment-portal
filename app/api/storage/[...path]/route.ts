import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuthSession } from "@/lib/auth";

const s3Client = new S3Client({
    forcePathStyle: true,
    region: process.env.SUPABASE_S3_REGION || "ap-northeast-1",
    endpoint: process.env.SUPABASE_S3_ENDPOINT || "https://ovfntwpehxejgwtcpifu.storage.supabase.co/storage/v1/s3",
    credentials: {
        accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY || "",
        secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY || "",
    }
});

export async function GET(
    request: Request,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;
        if (!path || path.length < 2) {
            return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
        }

        // The first part of the path is the bucket name, the rest is the file key
        const bucket = path[0];
        const key = path.slice(1).join("/");

        // 1. Auth check: Session (web) OR API Key (mobile)
        const isPublicDoctorImage = bucket === "uploads" && key.startsWith("doctors/");
        
        // Extract API Key from either headers or query parameters
        const { searchParams } = new URL(request.url);
        const queryApiKey = searchParams.get("apiKey");
        const headerApiKey = request.headers.get("x-api-key");
        const apiKey = queryApiKey || headerApiKey;
        
        const isValidApiKey = apiKey === (process.env.OPD_API_KEY || "pgf-opd-key-2026");
        
        console.log(`[StorageProxy] Request for ${bucket}/${key}`);
        console.log(`[StorageProxy] Auth method: ${queryApiKey ? "query" : headerApiKey ? "header" : "none"}`);
        console.log(`[StorageProxy] isValidApiKey: ${isValidApiKey}`);
        
        if (!isPublicDoctorImage && !isValidApiKey) {
            const session = await getAuthSession();
            console.log(`[StorageProxy] No valid API key, checking session... ${session ? "Found" : "Not Found"}`);
            if (!session) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        // 2. Generate a signed URL that expires in 1 hour
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        // 3. Redirect the browser to the signed URL
        return NextResponse.redirect(signedUrl);
    } catch (error: any) {
        console.error("Storage Proxy Error:", error);
        return NextResponse.json({ 
            error: "Failed to generate access to file", 
            details: error.message 
        }, { status: 500 });
    }
}
