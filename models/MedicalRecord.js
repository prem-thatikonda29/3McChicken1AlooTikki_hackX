import mongoose, { mongo } from "mongoose";

const MedicalRecordSchema = new mongoose.Schema(
    {
        personalInfo: {
            fullName: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            age: { type: Number, required: true },
            gender: {
                type: String,
                enum: ["male", "female", "other"],
                required: true,
            },
            height: { type: Number, required: true },
            weight: { type: Number, required: true },
        },
        lifestyle: {
            smoking: { type: String, enum: ["yes", "no"], required: true },
            alcohol: { type: String, enum: ["yes", "no"], required: true },
        },
        medicalHistory: {
            conditions: [{ type: String }],
            medications: {
                taking: { type: String, enum: ["yes", "no"], required: true },
                list: { type: String, default: "" },
            },
            familyHistory: {
                has: { type: String, enum: ["yes", "no"], required: true },
                conditions: [{ type: String }],
            },
            exercise: { type: String, required: true },
        },
    },
    { timestamps: true }
);

const MedicalRecordModel = mongoose.model("MedicalRecord", MedicalRecordSchema);

export default MedicalRecordModel;
