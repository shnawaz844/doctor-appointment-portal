import mongoose from "mongoose"

const ImagingStudySchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        patientId: { type: String, required: true },
        patientName: { type: String, required: true },
        studyType: { type: String, required: true },
        bodyPart: { type: String, required: true },
        modality: {
            type: String,
            required: true,
            enum: ["X-Ray", "CT", "MRI", "Ultrasound", "ECG", "EEG", "EMG", "Stress Test", "Holter Monitor", "Other"],
        },
        date: { type: String, required: true },
        month: { type: String, required: true },
        year: { type: String, required: true },
        aiFlag: {
            type: String,
            enum: ["Normal", "Abnormal", "Requires Review"],
        },
        doctor: { type: String, required: true },
        thumbnail: { type: String, default: "/placeholder.svg" },
        unique_citizen_card_number: { type: String, required: false },
    },
    { timestamps: true }
)

// Force delete the model in development to ensure schema changes are picked up
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.ImagingStudy
}

export default mongoose.models.ImagingStudy || mongoose.model("ImagingStudy", ImagingStudySchema)
