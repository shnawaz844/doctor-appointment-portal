import mongoose from "mongoose"

const DoctorSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        specialtyId: { type: String, required: true },
        phone: { type: String },
        email: { type: String },
    },
    { timestamps: true }
)

// Force delete the model in development to ensure schema changes are picked up
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Doctor
}

export default mongoose.models.Doctor || mongoose.model("Doctor", DoctorSchema)
