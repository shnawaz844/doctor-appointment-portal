import mongoose from "mongoose"

const InvoiceSchema = new mongoose.Schema(
    {
        invoiceId: {
            type: String,
            required: true,
            unique: true,
        },
        patientId: {
            type: String,
            required: true,
        },
        patientName: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        service: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["Paid", "Pending"],
            default: "Pending",
        },
        paymentMethod: {
            type: String,
            enum: ["Cash", "Online"],
            default: "Cash",
        },
        notes: {
            type: String,
        }
    },
    { timestamps: true },
)

// Force delete the model in development to ensure schema changes are picked up
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Invoice
}

export default mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema)
