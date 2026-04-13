import mongoose from "mongoose"

const LabValueSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        result: { type: String, required: true },
        unit: { type: String, default: "" },
        normalRange: { type: String, required: true },
    },
    { _id: false }
)

const LabResultSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        patientName: { type: String, required: true },
        patientId: { type: String, required: true },
        doctor: { type: String, required: true },
        testName: { type: String, required: true },
        testType: { type: String },
        date: { type: String, required: true },
        status: {
            type: String,
            required: true,
            enum: ["Pending", "Complete", "Processing"],
            default: "Pending",
        },
        result: { type: String, default: "Awaiting" },
        interpretation: { type: String },
        values: { type: [LabValueSchema], default: [] },
    },
    { timestamps: true }
)

// Force delete the model in development to ensure schema changes are picked up
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.LabResult
}

export default mongoose.models.LabResult || mongoose.model("LabResult", LabResultSchema)
