import MedicalRecordModel from "../models/MedicalRecord.js";

// Create a new medical record
async function createMedicalRecord(req, res) {
    try {
        const newRecord = new MedicalRecordModel(req.body);
        await newRecord.save();
        res.status(201).json({
            message: "Medical record created successfully",
            newRecord,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Get all medical records
async function getAllMedicalRecords(req, res) {
    try {
        const records = await MedicalRecordModel.find();
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Get a specific medical record by ID
async function getMedicalRecordById(req, res) {
    try {
        const record = await MedicalRecordModel.findById(req.params.id);
        if (!record) {
            return res
                .status(404)
                .json({ message: "Medical record not found" });
        }
        res.status(200).json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Update a medical record
async function updateMedicalRecord(req, res) {
    try {
        const updatedRecord = await MedicalRecordModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedRecord) {
            return res
                .status(404)
                .json({ message: "Medical record not found" });
        }
        res.status(200).json({
            message: "Medical record updated successfully",
            updatedRecord,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Delete a medical record
async function deleteMedicalRecord(req, res) {
    try {
        const deletedRecord = await MedicalRecordModel.findByIdAndDelete(
            req.params.id
        );
        if (!deletedRecord) {
            return res
                .status(404)
                .json({ message: "Medical record not found" });
        }
        res.status(200).json({
            message: "Medical record deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export {
    createMedicalRecord,
    getAllMedicalRecords,
    getMedicalRecordById,
    updateMedicalRecord,
    deleteMedicalRecord,
};
