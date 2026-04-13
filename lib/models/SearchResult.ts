import mongoose from "mongoose"

const SearchResultSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        patientName: { type: String, required: true },
        patientId: { type: String, required: true },
        documentType: { type: String, required: true },
        diagnosis: { type: String, required: true },
        date: { type: String, required: true },
        path: { type: String, required: true },
        aiCategory: { type: String, required: true },
        extractedFields: {
            type: Map,
            of: String,
        },
        aiTerms: [String],
        confidence: { type: Number, required: true },
    },
    { timestamps: true }
)

export default mongoose.models.SearchResult || mongoose.model("SearchResult", SearchResultSchema)
