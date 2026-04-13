import mongoose from "mongoose"

const MedicalRecordSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        patientName: { type: String, required: true },
        patientId: { type: String, required: true },
        recordType: {
            type: String,
            required: true,
            enum: [
                "Medical History",
                "Surgical Report",
                "Discharge Summary",
                "Progress Notes",
                "Treatment Plan",
                "Lab Report",
                "Imaging Report",
                "Other",
            ],
        },
        date: { type: String, required: true },
        doctor: { type: String, required: true },
        status: {
            type: String,
            required: true,
            enum: ["Active", "Archived"],
            default: "Active",
        },
        summary: { type: String, required: false },
        attachment_url: { type: String, required: false },
        attachment_type: { type: String, required: false },
        unique_citizen_card_number: { type: String, required: false },
    },
    { timestamps: true }
)

// Force delete the model in development to ensure schema changes are picked up
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.MedicalRecord
}

export default mongoose.models.MedicalRecord || mongoose.model("MedicalRecord", MedicalRecordSchema)
