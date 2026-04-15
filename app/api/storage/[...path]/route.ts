import { NextResponse } from "next/server"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { s3Client } from "@/lib/s3"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const segments = resolvedParams.path
    if (!segments || segments.length < 2) {
      return NextResponse.json({ error: "Invalid storage path" }, { status: 400 })
    }

    // First segment is the bucket name, rest is the object key
    const bucket = segments[0]
    const key = segments.slice(1).join("/")

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    const s3Response = await s3Client.send(command)

    if (!s3Response.Body) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const body = s3Response.Body as any

    // AWS SDK body can be either a Node stream or web stream depending on runtime.
    const bodyBuffer =
      typeof body?.transformToByteArray === "function"
        ? Buffer.from(await body.transformToByteArray())
        : await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = []
            body.on("data", (chunk: Buffer) => chunks.push(chunk))
            body.on("end", () => resolve(Buffer.concat(chunks)))
            body.on("error", reject)
          })

    const contentType = s3Response.ContentType || "application/octet-stream"

    return new Response(bodyBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": bodyBuffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error("[GET /api/storage] Error fetching from S3:", error)

    if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json(
      { error: "Failed to retrieve file", details: error.message },
      { status: 500 }
    )
  }
}
