import mongoose from "mongoose"

const OPDSchema = new mongoose.Schema(
    {
        uhidNo: { type: String, required: false },
        date: { type: String, required: true },
        tokenNo: { type: String },
        patientName: { type: String, required: true },
        ageSex: { type: String, required: true },
        opdNo: { type: String, required: true },
        guardianName: { type: String },
        mobileNo: { type: String, required: true },
        validUpto: { type: String, required: true },
        consultant: { type: String, required: true },
        address: { type: String, required: true },
        patientType: { type: String },
        createdBy: { type: String },
    },
    { timestamps: true }
)

// Force delete the model in development to ensure schema changes are picked up
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.OPD
}

export default mongoose.models.OPD || mongoose.model("OPD", OPDSchema)
