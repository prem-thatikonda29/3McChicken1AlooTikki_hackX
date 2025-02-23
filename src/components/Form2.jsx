import React, { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    },
  });

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  const totalSteps = 4;
  const progress = ((currentStep + 1) / totalSteps) * 100 - 1;

  const navigate = useNavigate();

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

    return description;
  };

  // Validation helper functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateNumber = (value, min, max) => {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  };

  const validateRequired = (value) => {
    return (
      value !== null && value !== undefined && value.toString().trim() !== ""
    );
  };

  // Form validation function
  const validateForm = (step) => {
    let errors = {};

    switch (step) {
      case 0:
        // Personal Info - Basic
        if (!validateRequired(formData.personalInfo.fullName)) {
          errors.fullName = "Full name is required";
        } else if (formData.personalInfo.fullName.length < 2) {
          errors.fullName = "Name must be at least 2 characters long";
        }

        if (!validateRequired(formData.personalInfo.email)) {
          errors.email = "Email is required";
        } else if (!validateEmail(formData.personalInfo.email)) {
          errors.email = "Please enter a valid email address";
        }
        break;

      case 1:
        // Personal Info - Demographics
        if (!validateRequired(formData.personalInfo.age)) {
          errors.age = "Age is required";
        } else if (!validateNumber(formData.personalInfo.age, 0, 120)) {
          errors.age = "Please enter a valid age between 0 and 120";
        }

        if (!validateRequired(formData.personalInfo.gender)) {
          errors.gender = "Gender is required";
        } else if (
          !["male", "female", "other"].includes(
            formData.personalInfo.gender.toLowerCase()
          )
        ) {
          errors.gender = "Please select a valid gender option";
        }
        break;

      case 2:
        // Physical Measurements and Smoking
        if (!validateRequired(formData.personalInfo.height)) {
          errors.height = "Height is required";
        } else if (!validateNumber(formData.personalInfo.height, 30, 300)) {
          errors.height = "Please enter a valid height between 30 and 300 cm";
        }

        if (!validateRequired(formData.personalInfo.weight)) {
          errors.weight = "Weight is required";
        } else if (!validateNumber(formData.personalInfo.weight, 1, 500)) {
          errors.weight = "Please enter a valid weight between 1 and 500 kg";
        }

        if (!validateRequired(formData.lifestyle.smoking)) {
          errors.smoking = "Please indicate smoking status";
        } else if (
          !["yes", "no"].includes(formData.lifestyle.smoking.toLowerCase())
        ) {
          errors.smoking = "Please select a valid smoking option";
        }
        break;

      case 3:
        // Medical History
        if (!validateRequired(formData.lifestyle.alcohol)) {
          errors.alcohol = "Please indicate alcohol consumption";
        } else if (
          !["yes", "no"].includes(formData.lifestyle.alcohol.toLowerCase())
        ) {
          errors.alcohol = "Please select a valid alcohol option";
        }

        if (!validateRequired(formData.medicalHistory.medications.taking)) {
          errors.medications = "Please indicate if you are taking medications";
        } else if (
          !["yes", "no"].includes(
            formData.medicalHistory.medications.taking.toLowerCase()
          )
        ) {
          errors.medications = "Please select a valid medication option";
        }

        if (
          formData.medicalHistory.medications.taking === "yes" &&
          !validateRequired(formData.medicalHistory.medications.list)
        ) {
          errors.medicationList = "Please list your medications";
        }
        break;
    }

    return errors;
  };

  const handleNext = () => {
    const errors = validateForm(currentStep);

    if (Object.keys(errors).length > 0) {
      // Display errors to user
      const errorMessages = Object.values(errors).join("\n");
      alert(errorMessages);
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
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

  // Initialize speech recognition
  useEffect(() => {
    if (!recognitionRef.current && window.webkitSpeechRecognition) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript;
        console.log("Live Word:", transcript);

        // Update the current input field with the transcript
        const currentField = document.activeElement;
        if (currentField && currentField.tagName === "INPUT") {
          currentField.value = transcript;
          // Trigger change event to update form state
          const event = new Event("input", { bubbles: true });
          currentField.dispatchEvent(event);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };
    }
  }, []);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser");
      return;
    }

    if (!isRecording) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Failed to start recording:", error);
      }
    } else {
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
      } catch (error) {
        console.error("Failed to stop recording:", error);
      }
    }
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Modified input field render function to include voice button
  const renderInput = (name, value, onChange, placeholder = "") => (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <button
        type="button"
        onClick={handleVoiceInput}
        className={`absolute right-3 top-1/2 transform -translate-y-1/2 
          ${isRecording ? "text-red-500 animate-pulse" : "text-gray-400"} 
          hover:text-blue-500 focus:outline-none transition-colors duration-200`}
      >
        <Mic className="w-5 h-5" />
        {isRecording && (
          <span className="absolute -top-2 -right-2 h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </button>
    </div>
  );

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
                {renderInput(
                  "fullName",
                  formData.personalInfo.fullName,
                  (e) =>
                    updateFormData("personalInfo", "fullName", e.target.value),
                  "Enter your full name"
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                {renderInput(
                  "email",
                  formData.personalInfo.email,
                  (e) =>
                    updateFormData("personalInfo", "email", e.target.value),
                  "Enter your email"
                )}
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
                {renderInput(
                  "age",
                  formData.personalInfo.age,
                  (e) => updateFormData("personalInfo", "age", e.target.value),
                  "Enter your age"
                )}
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
                {renderInput(
                  "height",
                  formData.personalInfo.height,
                  (e) =>
                    updateFormData("personalInfo", "height", e.target.value),
                  "Enter your height in cm"
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Weight (kg)
                </label>
                {renderInput(
                  "weight",
                  formData.personalInfo.weight,
                  (e) =>
                    updateFormData("personalInfo", "weight", e.target.value),
                  "Enter your weight in kg"
                )}
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
                    {renderInput(
                      "list",
                      formData.medicalHistory.medications.list,
                      (e) =>
                        updateFormData("medicalHistory", "medications", {
                          ...formData.medicalHistory.medications,
                          list: e.target.value,
                        }),
                      "Enter medications"
                    )}
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
                        checked={formData.medicalHistory.conditions.length > 0}
                        onChange={(e) => {
                          if (e.target.value === "yes") {
                            setFormData((prev) => ({
                              ...prev,
                              medicalHistory: {
                                ...prev.medicalHistory,
                                conditions: [
                                  ...prev.medicalHistory.conditions,
                                  ...prev.medicalHistory.conditions,
                                ],
                              },
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              medicalHistory: {
                                ...prev.medicalHistory,
                                conditions: [],
                              },
                            }));
                          }
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
                {formData.medicalHistory.conditions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.medicalHistory.conditions.map((condition) => (
                      <div
                        key={condition}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          id={`family-${condition}`}
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
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    try {
      // Final validation of all data
      let allErrors = {};
      for (let i = 0; i < totalSteps; i++) {
        const stepErrors = validateForm(i);
        allErrors = { ...allErrors, ...stepErrors };
      }

      if (Object.keys(allErrors).length > 0) {
        const errorMessages = Object.values(allErrors).join("\n");
        alert(errorMessages);
        return;
      }

      // Format data for submission
      const formattedData = {
        personalInfo: {
          fullName: formData.personalInfo.fullName.trim(),
          email: formData.personalInfo.email.toLowerCase().trim(),
          age: Number(formData.personalInfo.age),
          gender: formData.personalInfo.gender.toLowerCase(),
          height: Number(formData.personalInfo.height),
          weight: Number(formData.personalInfo.weight),
        },
        lifestyle: {
          smoking: formData.lifestyle.smoking.toLowerCase(),
          alcohol: formData.lifestyle.alcohol.toLowerCase(),
        },
        medicalHistory: {
          conditions: Array.isArray(formData.medicalHistory.conditions)
            ? formData.medicalHistory.conditions
            : [],
          medications: {
            taking: formData.medicalHistory.medications.taking.toLowerCase(),
            list: formData.medicalHistory.medications.list.trim(),
          },
        },
      };

      console.log("Submitting formatted data:", formattedData);

      const response = await fetch("http://localhost:3000/api/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Medical record created:", data);

      // Store the _id in localStorage
      localStorage.setItem("medicalRecordId", data.data._id);

      // Show success message
      alert("Medical record created successfully!");

      // Reset form
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
        },
      });

      // Navigate to home page
      navigate("/questions");
    } catch (error) {
      console.error("Error creating medical record:", error);
      alert(
        error.message || "Error creating medical record. Please try again."
      );
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
          Step {currentStep + 1} of {totalSteps}
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
