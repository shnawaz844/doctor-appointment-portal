import mongoose from "mongoose"

const DiagnosisSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        count: { type: Number, required: true },
        fill: { type: String, required: true },
    },
    { timestamps: true }
)

export default mongoose.models.Diagnosis || mongoose.model("Diagnosis", DiagnosisSchema)
