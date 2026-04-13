import mongoose from "mongoose"

const specialtySchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        description: { type: String },
    },
    { timestamps: true }
)

// Force delete the model in development to ensure schema changes are picked up
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.specialty
}

export default mongoose.models.specialty || mongoose.model("specialty", specialtySchema)
