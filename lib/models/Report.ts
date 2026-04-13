import mongoose from "mongoose"

const ReportSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        patientId: { type: String, required: true },
        type: {
            type: String,
            required: true,
            enum: [
                "MRI",
                "X-Ray",
                "CT-Scan",
                "Ultrasound",
                "Physical Therapy",
                "Surgical Notes",
                "Prescription",
                "Discharge",
            ],
        },
        name: { type: String, required: true },
        date: { type: String, required: true },
        path: { type: String, required: true },
    },
    { timestamps: true }
)

export default mongoose.models.Report || mongoose.model("Report", ReportSchema)
