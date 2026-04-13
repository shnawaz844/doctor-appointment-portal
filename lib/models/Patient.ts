import mongoose from "mongoose"

const PatientSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        age: { type: Number, required: true },
        gender: { type: String, required: true },
        phone: { type: String, required: true },
        diagnosis: { type: String, required: true },
        doctor: { type: String, required: true },
        lastVisit: { type: String, required: true },
        reportType: { type: String, required: true },
        year: { type: String, required: true },
        month: { type: String, required: true },
        laterality: { type: String, enum: ["Right", "Left", "Bilateral"] },
        severity: { type: String, enum: ["Mild", "Moderate", "Severe"] },
        injuryDate: { type: String },
        surgeryRequired: { type: Boolean },
        physicalTherapy: { type: Boolean },
        address: { type: String },
        guardianName: { type: String },
        createdBy: { type: String },
    },
    { timestamps: true }
)

// Force delete the model in development to ensure schema changes are picked up
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Patient
}

export default mongoose.models.Patient || mongoose.model("Patient", PatientSchema)
