import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const message = formData.get("message") as string
    const files = formData.getAll("file_0") || []

    // Mock response for file upload and patient extraction
    if (files.length > 0 || message.toLowerCase().includes("upload")) {
      return NextResponse.json({
        uploaded: {
          fileName: "medical_report.pdf",
          type: "MRI",
        },
        extracted: {
          name: "John Doe",
          phone: "+91-9876543220",
          diagnosis: "Lumbar Disc Herniation",
        },
        patients: [
          {
            id: "P009",
            name: "John Doe",
            phone: "+91-9876543220",
            diagnosis: "Lumbar Disc Herniation",
            found: false,
            reports: ["Lumbar_MRI_Report.pdf"],
            matchedData: {
              "Study Type": "Lumbar Spine MRI",
              Diagnosis: "Lumbar Disc Herniation",
              Severity: "Moderate",
              Recommendation: "Conservative treatment with PT",
            },
          },
        ],
        mapped: {
          count: 1,
          patientId: "P009",
        },
      })
    }

    // Response for patient queries using Supabase
    if (message.toLowerCase().includes("spine") || message.toLowerCase().includes("spine injury")) {
      const { data: spinePatients, error } = await supabase
        .from("patients")
        .select("*")
        .or("diagnosis.ilike.%spine%,diagnosis.ilike.%disc%,diagnosis.ilike.%cervical%")

      if (error) {
        console.error("Supabase query error:", error)
        return NextResponse.json({ error: "Failed to query patients" }, { status: 500 })
      }

      return NextResponse.json({
        query: message,
        queryResults: spinePatients || [],
      })
    }

    // Default response
    return NextResponse.json({
      message: "Query processed",
      queryResults: [],
    })
  } catch (error) {
    console.error("Chat processing error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
