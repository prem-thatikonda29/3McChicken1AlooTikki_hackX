import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const MedicalForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    personalInfo: {
      fullName: "",
      age: "",
      gender: "",
      height: "",
      weight: "",
    },
    lifestyle: {
      smoking: "",
      alcohol: "",
    },
    medicalHistory: {
      conditions: [],
      medications: {
        taking: "",
        list: "",
      },
      familyHistory: {
        has: "",
        conditions: [],
      },
      exercise: "",
    },
  });

  const totalSteps = 11;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const updateFormData = (category, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Log the final form data object when form is complete
      console.log("Final Form Data:", formData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Label>Full Name</Label>
            <Input
              value={formData.personalInfo.fullName}
              onChange={(e) =>
                updateFormData("personalInfo", "fullName", e.target.value)
              }
              placeholder="Enter your full name"
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <Label>Age</Label>
            <Input
              type="number"
              value={formData.personalInfo.age}
              onChange={(e) =>
                updateFormData("personalInfo", "age", e.target.value)
              }
              placeholder="Enter your age"
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <Label>Gender</Label>
            <RadioGroup
              value={formData.personalInfo.gender}
              onValueChange={(value) =>
                updateFormData("personalInfo", "gender", value)
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <Label>Height (cm)</Label>
            <Input
              type="number"
              value={formData.personalInfo.height}
              onChange={(e) =>
                updateFormData("personalInfo", "height", e.target.value)
              }
              placeholder="Enter your height in cm"
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <Label>Weight (kg)</Label>
            <Input
              type="number"
              value={formData.personalInfo.weight}
              onChange={(e) =>
                updateFormData("personalInfo", "weight", e.target.value)
              }
              placeholder="Enter your weight in kg"
            />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <Label>Do you smoke?</Label>
            <RadioGroup
              value={formData.lifestyle.smoking}
              onValueChange={(value) =>
                updateFormData("lifestyle", "smoking", value)
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="smoke-yes" />
                <Label htmlFor="smoke-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="smoke-no" />
                <Label htmlFor="smoke-no">No</Label>
              </div>
            </RadioGroup>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <Label>Do you consume alcohol?</Label>
            <RadioGroup
              value={formData.lifestyle.alcohol}
              onValueChange={(value) =>
                updateFormData("lifestyle", "alcohol", value)
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="alcohol-yes" />
                <Label htmlFor="alcohol-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="alcohol-no" />
                <Label htmlFor="alcohol-no">No</Label>
              </div>
            </RadioGroup>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <Label>Medical Conditions</Label>
            <div className="space-y-2">
              {[
                "Diabetes",
                "Hypertension",
                "Heart Disease",
                "Thyroid",
                "Asthma",
                "None",
              ].map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox
                    id={condition}
                    checked={formData.medicalHistory.conditions.includes(
                      condition
                    )}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData((prev) => ({
                          ...prev,
                          medicalHistory: {
                            ...prev.medicalHistory,
                            conditions: [
                              ...prev.medicalHistory.conditions,
                              condition,
                            ],
                          },
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          medicalHistory: {
                            ...prev.medicalHistory,
                            conditions: prev.medicalHistory.conditions.filter(
                              (c) => c !== condition
                            ),
                          },
                        }));
                      }
                    }}
                  />
                  <Label htmlFor={condition}>{condition}</Label>
                </div>
              ))}
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <Label>Are you currently on any medication?</Label>
            <RadioGroup
              value={formData.medicalHistory.medications.taking}
              onValueChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  medicalHistory: {
                    ...prev.medicalHistory,
                    medications: {
                      ...prev.medicalHistory.medications,
                      taking: value,
                    },
                  },
                }));
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="med-yes" />
                <Label htmlFor="med-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="med-no" />
                <Label htmlFor="med-no">No</Label>
              </div>
            </RadioGroup>
            {formData.medicalHistory.medications.taking === "yes" && (
              <div className="mt-4">
                <Label>List your medications</Label>
                <Input
                  value={formData.medicalHistory.medications.list}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      medicalHistory: {
                        ...prev.medicalHistory,
                        medications: {
                          ...prev.medicalHistory.medications,
                          list: e.target.value,
                        },
                      },
                    }));
                  }}
                  placeholder="Enter medications"
                />
              </div>
            )}
          </div>
        );
      case 9:
        return (
          <div className="space-y-4">
            <Label>Do you have a family history of medical conditions?</Label>
            <RadioGroup
              value={formData.medicalHistory.familyHistory.has}
              onValueChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  medicalHistory: {
                    ...prev.medicalHistory,
                    familyHistory: {
                      ...prev.medicalHistory.familyHistory,
                      has: value,
                    },
                  },
                }));
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="history-yes" />
                <Label htmlFor="history-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="history-no" />
                <Label htmlFor="history-no">No</Label>
              </div>
            </RadioGroup>
            {formData.medicalHistory.familyHistory.has === "yes" && (
              <div className="mt-4 space-y-2">
                {[
                  "Heart Disease",
                  "Stroke",
                  "Cancer",
                  "Diabetes",
                  "Hypertension",
                ].map((condition) => (
                  <div key={condition} className="flex items-center space-x-2">
                    <Checkbox
                      id={`family-${condition}`}
                      checked={formData.medicalHistory.familyHistory.conditions.includes(
                        condition
                      )}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData((prev) => ({
                            ...prev,
                            medicalHistory: {
                              ...prev.medicalHistory,
                              familyHistory: {
                                ...prev.medicalHistory.familyHistory,
                                conditions: [
                                  ...prev.medicalHistory.familyHistory
                                    .conditions,
                                  condition,
                                ],
                              },
                            },
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            medicalHistory: {
                              ...prev.medicalHistory,
                              familyHistory: {
                                ...prev.medicalHistory.familyHistory,
                                conditions:
                                  prev.medicalHistory.familyHistory.conditions.filter(
                                    (c) => c !== condition
                                  ),
                              },
                            },
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={`family-${condition}`}>{condition}</Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 10:
        return (
          <div className="space-y-4">
            <Label>How often do you exercise?</Label>
            <RadioGroup
              value={formData.medicalHistory.exercise}
              onValueChange={(value) =>
                updateFormData("medicalHistory", "exercise", value)
              }
            >
              {["Never", "1-2 days/week", "3-4 days/week", "Daily"].map(
                (option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option}>{option}</Label>
                  </div>
                )
              )}
            </RadioGroup>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="mb-8">
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Step {currentStep + 1} of {totalSteps}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {renderStep()}

          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentStep === totalSteps - 1}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalForm;
