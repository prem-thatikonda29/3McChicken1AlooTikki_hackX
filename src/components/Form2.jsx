import React, { useEffect } from "react";

const MedicalForm = () => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState({
    personalInfo: {
      fullName: "",
      email: "",
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

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (category, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const generateMedicalDescription = () => {
    let description = "Medical Assessment Summary:\n\n";

    // Basic Information
    description += "Personal Information:\n";
    description += `Full Name: ${formData.personalInfo.fullName}\n`;
    description += `Email: ${formData.personalInfo.email}\n`;
    description += `Age: ${formData.personalInfo.age}\n`;
    description += `Gender: ${formData.personalInfo.gender}\n`;

    // Physical Measurements
    description += "\nPhysical Measurements:\n";
    description += `Height: ${formData.personalInfo.height} cm\n`;
    description += `Weight: ${formData.personalInfo.weight} kg\n`;

    // Lifestyle
    description += "\nLifestyle Factors:\n";
    description += `Smoking: ${formData.lifestyle.smoking}\n`;
    description += `Alcohol Consumption: ${formData.lifestyle.alcohol}\n`;
    description += `Exercise Frequency: ${formData.medicalHistory.exercise}\n`;

    // Medical History
    description += "\nMedical Conditions:\n";
    description += `Current Conditions: ${
      formData.medicalHistory.conditions.length
        ? formData.medicalHistory.conditions.join(", ")
        : "None"
    }\n`;

    // Medications
    description += "\nMedications:\n";
    description += `Currently Taking Medications: ${formData.medicalHistory.medications.taking}\n`;
    if (formData.medicalHistory.medications.taking === "yes") {
      description += `Medication List: ${formData.medicalHistory.medications.list}\n`;
    }

    // Family History
    description += "\nFamily History:\n";
    description += `Has Family History: ${formData.medicalHistory.familyHistory.has}\n`;
    if (formData.medicalHistory.familyHistory.has === "yes") {
      description += `Family Conditions: ${formData.medicalHistory.familyHistory.conditions.join(
        ", "
      )}\n`;
    }

    return description;
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);

      // Log current form state after each step
      console.log("Current Form Data:", {
        step: currentStep + 1,
        formData,
      });
    } else {
      // On final submission
      const description = generateMedicalDescription();
      const medicalFormData = {
        formData: {
          personalInfo: {
            fullName: formData.personalInfo.fullName,
            email: formData.personalInfo.email,
            age: formData.personalInfo.age,
            gender: formData.personalInfo.gender,
            height: formData.personalInfo.height,
            weight: formData.personalInfo.weight,
          },
          lifestyle: {
            smoking: formData.lifestyle.smoking,
            alcohol: formData.lifestyle.alcohol,
          },
          medicalHistory: {
            conditions: formData.medicalHistory.conditions,
            medications: {
              taking: formData.medicalHistory.medications.taking,
              list: formData.medicalHistory.medications.list,
            },
            familyHistory: {
              has: formData.medicalHistory.familyHistory.has,
              conditions: formData.medicalHistory.familyHistory.conditions,
            },
            exercise: formData.medicalHistory.exercise,
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
          assessmentId: Math.random().toString(36).substr(2, 9),
          status: "completed",
        },
        description: description,
      };

      // Console log the complete form object
      console.group("Medical Assessment Form Submission");
      console.log("Complete Form Object:", medicalFormData);
      console.log("\nAssessment Summary:");
      console.log(description);
      console.groupEnd();

      // Store in localStorage
      localStorage.setItem("medicalFormData", JSON.stringify(medicalFormData));

      // Reset form or redirect
      setCurrentStep(0);
      setFormData({
        personalInfo: {
          fullName: "",
          email: "",
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

      // Alert user of successful submission
      alert("Form submitted successfully! Check console for details.");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Add logging when form data changes
  useEffect(() => {
    console.log("Form Data Updated:", formData);
  }, [formData]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Basic Information
              </h2>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.personalInfo.fullName}
                  onChange={(e) =>
                    updateFormData("personalInfo", "fullName", e.target.value)
                  }
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.personalInfo.email}
                  onChange={(e) =>
                    updateFormData("personalInfo", "email", e.target.value)
                  }
                  placeholder="Enter your email"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Secondary Information
              </h2>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Age
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.personalInfo.age}
                  onChange={(e) =>
                    updateFormData("personalInfo", "age", e.target.value)
                  }
                  placeholder="Enter your age"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Gender
              </label>
              <div className="space-y-2">
                {["male", "female", "other"].map((gender) => (
                  <div key={gender} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={gender}
                      value={gender}
                      checked={formData.personalInfo.gender === gender}
                      onChange={(e) =>
                        updateFormData("personalInfo", "gender", e.target.value)
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor={gender}
                      className="text-sm text-gray-700 capitalize"
                    >
                      {gender}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Lifestyle</h2>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Height (cm)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.personalInfo.height}
                  onChange={(e) =>
                    updateFormData("personalInfo", "height", e.target.value)
                  }
                  placeholder="Enter your height in cm"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.personalInfo.weight}
                  onChange={(e) =>
                    updateFormData("personalInfo", "weight", e.target.value)
                  }
                  placeholder="Enter your weight in kg"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Do you smoke?
                </label>
                <div className="space-y-2">
                  {["yes", "no"].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`smoke-${option}`}
                        value={option}
                        checked={formData.lifestyle.smoking === option}
                        onChange={(e) =>
                          updateFormData("lifestyle", "smoking", e.target.value)
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label
                        htmlFor={`smoke-${option}`}
                        className="text-sm text-gray-700 capitalize"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Medical History
              </h2>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Do you consume alcohol?
                </label>
                <div className="space-y-2">
                  {["yes", "no"].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`alcohol-${option}`}
                        value={option}
                        checked={formData.lifestyle.alcohol === option}
                        onChange={(e) =>
                          updateFormData("lifestyle", "alcohol", e.target.value)
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label
                        htmlFor={`alcohol-${option}`}
                        className="text-sm text-gray-700 capitalize"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Medical Conditions
                </label>
                <div className="space-y-2">
                  {[
                    "Diabetes",
                    "Hypertension",
                    "Heart Disease",
                    "Thyroid",
                    "Asthma",
                    "None",
                  ].map((condition) => (
                    <div
                      key={condition}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        id={condition}
                        checked={formData.medicalHistory.conditions.includes(
                          condition
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
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
                                conditions:
                                  prev.medicalHistory.conditions.filter(
                                    (c) => c !== condition
                                  ),
                              },
                            }));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={condition}
                        className="text-sm text-gray-700"
                      >
                        {condition}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Are you currently on any medication?
                </label>
                <div className="space-y-2">
                  {["yes", "no"].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`med-${option}`}
                        value={option}
                        checked={
                          formData.medicalHistory.medications.taking === option
                        }
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            medicalHistory: {
                              ...prev.medicalHistory,
                              medications: {
                                ...prev.medicalHistory.medications,
                                taking: e.target.value,
                              },
                            },
                          }));
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label
                        htmlFor={`med-${option}`}
                        className="text-sm text-gray-700 capitalize"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {formData.medicalHistory.medications.taking === "yes" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      List your medications
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Medical History
              </h2>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Do you have a family history of medical conditions?
                </label>
                <div className="space-y-2">
                  {["yes", "no"].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`history-${option}`}
                        value={option}
                        checked={
                          formData.medicalHistory.familyHistory.has === option
                        }
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            medicalHistory: {
                              ...prev.medicalHistory,
                              familyHistory: {
                                ...prev.medicalHistory.familyHistory,
                                has: e.target.value,
                              },
                            },
                          }));
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label
                        htmlFor={`history-${option}`}
                        className="text-sm text-gray-700 capitalize"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {formData.medicalHistory.familyHistory.has === "yes" && (
                  <div className="mt-4 space-y-2">
                    {[
                      "Heart Disease",
                      "Stroke",
                      "Cancer",
                      "Diabetes",
                      "Hypertension",
                    ].map((condition) => (
                      <div
                        key={condition}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          id={`family-${condition}`}
                          checked={formData.medicalHistory.familyHistory.conditions.includes(
                            condition
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
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
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`family-${condition}`}
                          className="text-sm text-gray-700"
                        >
                          {condition}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  How often do you exercise?
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.medicalHistory.exercise}
                  onChange={(e) =>
                    updateFormData("medicalHistory", "exercise", e.target.value)
                  }
                >
                  <option value="">Select frequency</option>
                  <option value="never">Never</option>
                  <option value="rarely">Rarely</option>
                  <option value="sometimes">1-2 times a week</option>
                  <option value="regularly">3-4 times a week</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-600 text-right">
          Step {currentStep} of {totalSteps}
        </div>
      </div>

      {/* Form content */}
      <form onSubmit={(e) => e.preventDefault()}>
        {renderStep()}

        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              currentStep === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
            }`}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {currentStep === totalSteps - 1 ? "Submit" : "Next"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicalForm;
