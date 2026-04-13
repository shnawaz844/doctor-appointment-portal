import mongoose from "mongoose"

const AppointmentSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        patientName: { type: String, required: true },
        patientId: { type: String, required: true },
        date: { type: String, required: true },
        time: { type: String, required: true },
        doctor: { type: String, required: true },
        specialty: { type: String, required: true },
        type: { type: String, required: true },
        status: {
            type: String,
            required: true,
            enum: ["Scheduled", "Confirmed", "Completed", "Cancelled"],
            default: "Scheduled",
        },
        phone: { type: String, required: true },
        notes: { type: String },
        unique_citizen_card_number: { type: String, required: false },
    },
    { timestamps: true }
)

// Force delete the model in development to ensure schema changes are picked up
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Appointment
}

export default mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema)
