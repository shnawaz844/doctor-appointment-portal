import mongoose from "mongoose"

const PrescriptionSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        patientName: { type: String, required: true },
        patientId: { type: String, required: true },
        medications: [
            {
                medication: { type: String, required: true },
                dosage: { type: String, required: true },
                quantity: { type: Number, required: true },
            },
        ],
        issued: { type: String, required: true },
        status: {
            type: String,
            required: true,
            enum: ["Active", "Filled", "Expired"],
            default: "Active",
        },
        doctorName: { type: String, required: true },
        doctorId: { type: String, required: true },
        instructions: { type: String },
        duration: { type: String },
        unique_citizen_card_number: { type: String, required: false },
        attachment_url: { type: String, required: false },
        attachment_type: { type: String, required: false },
    },
    { timestamps: true }
)

// Force delete the model in development to ensure schema changes are picked up
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Prescription
}

export default mongoose.models.Prescription || mongoose.model("Prescription", PrescriptionSchema)
