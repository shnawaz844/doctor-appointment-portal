import mongoose from "mongoose"

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please provide a name"],
        },
        email: {
            type: String,
            required: [true, "Please provide an email"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Please provide a password"],
            select: false,
        },
        role: {
            type: String,
            enum: ["ADMIN", "DOCTOR", "STAFF"],
            default: "STAFF",
        },
        resetPasswordToken: String,
        resetPasswordExpires: Date,
    },
    {
        timestamps: true,
    }
)

// Force delete the model in development to ensure schema changes are picked up
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.User
}

export default mongoose.models.User || mongoose.model("User", UserSchema)
