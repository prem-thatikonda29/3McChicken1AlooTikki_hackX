import express from "express";
const router = express.Router();

import {
    createMedicalRecord,
    getAllMedicalRecords,
    getMedicalRecordById,
    updateMedicalRecord,
    deleteMedicalRecord,
} from "../controllers/medicalController.js";

router.post("/", createMedicalRecord);
router.get("/", getAllMedicalRecords);
router.get("/:id", getMedicalRecordById);
router.put("/:id", updateMedicalRecord);
router.delete("/:id", deleteMedicalRecord);

export default router;
