import { S3Client } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
    forcePathStyle: true,
    region: process.env.SUPABASE_S3_REGION || "ap-southeast-1",
    endpoint: process.env.SUPABASE_S3_ENDPOINT || `https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}.storage.supabase.co/storage/v1/s3`,
    credentials: {
        accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY || "",
        secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY || "",
    }
})

export { s3Client }
