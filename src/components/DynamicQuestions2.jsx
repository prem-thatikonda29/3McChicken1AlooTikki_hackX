import React, { useState, useEffect, useRef, useCallback } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mic } from "lucide-react";
import NearbyHospitalsOSM from "./Map";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { WhatsappShareButton } from "react-share";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Custom hook for speech-to-text
function useSpeechToText(options = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      setError("Web speech API is not supported in this browser");
      return;
    }

    const initializeRecognition = () => {
      recognitionRef.current = new window.webkitSpeechRecognition();
      const recognition = recognitionRef.current;

      recognition.interimResults = options.interimResults || true;
      recognition.lang = options.lang || "en-US";
      recognition.continuous = options.continuous || false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        console.log("Speech recognition started");
      };

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
        retryCount.current = 0; // Reset retry count on successful result
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);

        if (event.error === "network" && retryCount.current < maxRetries) {
          retryCount.current += 1;
          console.log(
            `Retrying... Attempt ${retryCount.current} of ${maxRetries}`
          );

          // Wait briefly before retrying
          setTimeout(() => {
            try {
              recognition.stop();
              recognition.start();
            } catch (e) {
              setError("Failed to restart recognition");
              setIsListening(false);
            }
          }, 1000);
        } else {
          setError(`Recognition error: ${event.error}. Please try again.`);
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (isListening && retryCount.current < maxRetries) {
          // Attempt to restart if we were still meant to be listening
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
            setError("Recognition ended unexpectedly");
          }
        } else {
          setIsListening(false);
        }
      };
    };

    initializeRecognition();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [options.interimResults, options.lang, options.continuous]);

  const startListening = () => {
    if (recognitionRef.current) {
      retryCount.current = 0; // Reset retry count
      setError(null);
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting recognition:", error);
        setError("Failed to start recognition. Please try again.");
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    }
  };

  return { isListening, transcript, error, startListening, stopListening };
}

const DynamicQuestions = () => {
  const navigate = useNavigate();
  // State variables
  const [medicalData, setMedicalData] = useState(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userResponse, setUserResponse] = useState("");
  const [conversation, setConversation] = useState([]);
  const [processingResponse, setProcessingResponse] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assessmentReport, setAssessmentReport] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [previousQuestions, setPreviousQuestions] = useState(new Set());
  const [showUnderwriterButtons, setShowUnderwriterButtons] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showUnderwriterModal, setShowUnderwriterModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showEmergencyButton, setShowEmergencyButton] = useState(false);
  const [localEmergencyContact, setLocalEmergencyContact] = useState("");
  const [localIsValidContact, setLocalIsValidContact] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState("");

  const recognitionRef = useRef(null);
  const totalQuestions = 5;

  // Initialize Google AI with a valid API key
  const genAI = new GoogleGenerativeAI(
    "AIzaSyB-azWTWmG-9iP_igzqpNYubHwWJRrGrA8"
  ); // Replace with actual key

  const {
    isListening: voiceListening,
    transcript,
    error: speechError,
    startListening: startVoice,
    stopListening: stopVoice,
  } = useSpeechToText({
    continuous: false,
    interimResults: true,
    lang: "en-US",
  });

  // Add effect to update userResponse when transcript changes
  useEffect(() => {
    if (transcript) {
      setUserResponse((prev) => {
        const newResponse = prev.trim() + " " + transcript.trim();
        return newResponse.trim();
      });
    }
  }, [transcript]);

  // Fetch medical data first
  useEffect(() => {
    const fetchMedicalRecord = async () => {
      try {
        const medicalRecordId = localStorage.getItem("medicalRecordId");
        if (!medicalRecordId) {
          throw new Error("No medical record ID found");
        }

        const response = await fetch(
          `http://localhost:3000/api/${medicalRecordId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch medical data");
        }

        const result = await response.json();
        console.log("Fetched medical data:", result.data);
        setMedicalData(result.data);

        // Only start generating questions after medical data is loaded
        setLoading(false);
      } catch (err) {
        console.error("Error fetching medical data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchMedicalRecord();
  }, []);

  // Add debug logging to the useEffect
  useEffect(() => {
    const initializeQuestions = async () => {
      if (medicalData && !currentQuestion && !loading) {
        console.log("Initializing questions with medical data:", medicalData);
        try {
          await generateNextQuestion();
        } catch (err) {
          console.error("Error generating initial question:", err);
          setError("Failed to start the assessment");
        }
      }
    };

    initializeQuestions();
  }, [medicalData, loading]);

  // Predefined questions for health assessment
  const questionBank = {
    1: {
      text: "How would you rate your daily energy levels?",
      type: "radio",
      options: [
        "Very low - I feel tired most of the time",
        "Low - I often feel tired",
        "Moderate - I have enough energy for basic tasks",
        "High - I generally feel energetic",
      ],
    },
    2: {
      text: "How often do you engage in physical exercise?",
      type: "radio",
      options: [
        "Never or rarely",
        "1-2 times per week",
        "3-4 times per week",
        "5 or more times per week",
      ],
    },
    3: {
      text: "Please describe any recurring health symptoms or concerns you've experienced in the past month.",
      type: "text",
      placeholder: "Describe your symptoms, frequency, and severity...",
    },
    4: {
      text: "How would you describe your stress levels in the past month?",
      type: "radio",
      options: [
        "Minimal - rarely feel stressed",
        "Mild - occasionally feel stressed",
        "Moderate - frequently feel stressed",
        "Severe - constantly feel stressed",
      ],
    },
    5: {
      text: "How would you rate your sleep quality?",
      type: "radio",
      options: [
        "Poor - difficulty sleeping most nights",
        "Fair - occasional sleep issues",
        "Good - usually sleep well",
        "Excellent - consistently sleep well",
      ],
    },
  };

  const fallbackToDefaultQuestion = () => {
    console.log("Using fallback question");
    const defaultQuestions = {
      1: {
        text: "How would you rate your daily energy levels?",
        type: "radio",
        options: [
          "Very low - I feel tired most of the time",
          "Low - I often feel tired",
          "Moderate - I have enough energy for basic tasks",
          "High - I generally feel energetic",
        ],
      },
      2: {
        text: "How often do you engage in physical exercise?",
        type: "radio",
        options: [
          "Never or rarely",
          "1-2 times per week",
          "3-4 times per week",
          "5 or more times per week",
        ],
      },
      3: {
        text: "Please describe any recurring health symptoms or concerns you've experienced in the past month.",
        type: "text",
        placeholder: "Describe your symptoms, frequency, and severity...",
      },
      4: {
        text: "How would you describe your stress levels in the past month?",
        type: "radio",
        options: [
          "Minimal - rarely feel stressed",
          "Mild - occasionally feel stressed",
          "Moderate - frequently feel stressed",
          "Severe - constantly feel stressed",
        ],
      },
      5: {
        text: "How would you rate your sleep quality?",
        type: "radio",
        options: [
          "Poor - difficulty sleeping most nights",
          "Fair - occasional sleep issues",
          "Good - usually sleep well",
          "Excellent - consistently sleep well",
        ],
      },
    };

    const currentQ = defaultQuestions[currentQuestionNumber];
    if (currentQ) {
      console.log("Setting fallback question:", currentQ);
      setCurrentQuestion(currentQ);
      setPreviousQuestions((prev) => new Set([...prev, currentQ.text]));
    } else {
      setIsComplete(true);
    }
    setIsLoadingQuestion(false);
  };

  // Add new state for loading
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);

  const generateNextQuestion = async () => {
    setIsLoadingQuestion(true);
    try {
      const API_KEY = "AIzaSyCKd_RAkGIkpGUOcyk6WcR04jNXbaj-5wg";

      // Get previous answers
      const previousAnswers = conversation.reduce(
        (pairs, item, index, array) => {
          if (index % 2 === 0) {
            pairs.push({
              question: item.content,
              answer: array[index + 1]?.content || "",
            });
          }
          return pairs;
        },
        []
      );

      // Create personalized initial question context
      const getInitialQuestionContext = () => {
        const { age, gender } = medicalData.personalInfo;
        const conditions = medicalData.medicalHistory.conditions;
        const { exercise, stress, sleep } = medicalData.lifestyle;

        if (currentQuestionNumber === 1) {
          if (conditions.length > 0) {
            return `Ask about their ${conditions[0]} management`;
          } else if (stress > 7) {
            return `Ask about their high stress impact`;
          } else if (sleep < 6) {
            return `Ask about their sleep issues`;
          } else if (!exercise) {
            return `Ask about physical activity`;
          } else if (age > 50) {
            return `Ask about age-related health changes`;
          } else {
            return `Ask about general health status`;
          }
        }

        return `Follow up on: ${
          previousAnswers[previousAnswers.length - 1]?.answer
        }`;
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate a brief health assessment question.

                User Profile:
                Age: ${medicalData.personalInfo.age}
                Gender: ${medicalData.personalInfo.gender}
                Conditions: ${
                  medicalData.medicalHistory.conditions.join(", ") || "None"
                }
                Lifestyle: ${JSON.stringify(medicalData.lifestyle)}
                
                Context: ${getInitialQuestionContext()}
                Question Number: ${currentQuestionNumber}/5
                
                Guidelines:
                - Keep questions short and direct
                - Focus on risk assessment
                - Consider user profile
                - Be conversational
                
                Question Focus:
                ${
                  currentQuestionNumber === 1
                    ? "Primary health concern"
                    : currentQuestionNumber === 2
                    ? "Lifestyle impact"
                    : currentQuestionNumber === 3
                    ? "Specific symptoms"
                    : currentQuestionNumber === 4
                    ? "Risk factors"
                    : "Prevention"
                }

                Return JSON:
                {
                  "text": "brief question here",
                  "type": "${currentQuestionNumber === 3 ? "text" : "radio"}",
                  ${
                    currentQuestionNumber === 3
                      ? '"placeholder": "brief guide..."'
                      : '"options": ["option1", "option2", "option3", "option4"]'
                  }
                }`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }

      const questionData = JSON.parse(jsonMatch[0]);

      if (
        !questionData.text ||
        !questionData.type ||
        (questionData.type === "radio" &&
          (!questionData.options || !Array.isArray(questionData.options))) ||
        (questionData.type === "text" && !questionData.placeholder)
      ) {
        throw new Error("Invalid question format");
      }

      setCurrentQuestion(questionData);
      setPreviousQuestions((prev) => new Set([...prev, questionData.text]));
      setUserResponse("");
    } catch (err) {
      console.error("Error generating question:", err);
      fallbackToDefaultQuestion();
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const renderTextInput = () => (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={userResponse}
          onChange={(e) => setUserResponse(e.target.value)}
          placeholder={currentQuestion?.placeholder || "Type your response..."}
          className="w-full p-4 pr-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 
            focus:ring-2 focus:ring-blue-100 transition-all duration-200 min-h-[100px] resize-none"
          maxLength={500}
          style={{ paddingRight: "3rem" }}
        />
        <button
          onClick={voiceListening ? stopVoice : startVoice}
          className={`absolute right-3 bottom-3 p-2 rounded-full transition-colors duration-200 
            ${
              voiceListening
                ? "bg-red-500 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-600"
            } z-10`}
          type="button"
        >
          <Mic className={`w-5 h-5 ${voiceListening ? "animate-pulse" : ""}`} />
        </button>
      </div>
      <div className="flex justify-between text-sm text-gray-500">
        <span>
          {voiceListening
            ? "Listening... Speak now"
            : speechError
            ? `Error: ${speechError}`
            : "Click the mic to speak"}
        </span>
        <span>{userResponse.length}/500 characters</span>
      </div>
      {voiceListening && (
        <div className="text-sm text-blue-500 italic">
          Real-time: {transcript}
        </div>
      )}
    </div>
  );

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    if (currentQuestion.type === "text") {
      return (
        <div className="space-y-4">
          <textarea
            value={userResponse}
            onChange={(e) => setUserResponse(e.target.value)}
            placeholder="Type your response here..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
          />
          {/* Voice input button */}
          <button
            onClick={voiceListening ? stopVoice : startVoice}
            className={`w-full py-3 px-4 rounded-xl font-poppins font-medium transition-all duration-300 flex items-center justify-center space-x-2
              ${
                voiceListening
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <span>
              {voiceListening ? "Stop Recording" : "Start Voice Input"}
            </span>
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {currentQuestion.options?.map((option, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
              userResponse === option
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-200"
            }`}
            onClick={() => setUserResponse(option)}
          >
            <div className="flex items-center">
              <input
                type="radio"
                id={`option-${index}`}
                name="question-option"
                value={option}
                checked={userResponse === option}
                onChange={(e) => setUserResponse(e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label
                htmlFor={`option-${index}`}
                className="ml-3 text-gray-700 cursor-pointer flex-grow font-poppins"
              >
                {option}
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        setShouldRestart(false);
        recognitionRef.current.stop();
        setIsListening(false);
      }
    };
  }, []);

  // Add function to format report for WhatsApp
  const formatReportForWhatsApp = (report) => {
    return `🚨 *URGENT HEALTH RISK ALERT* 🚨

*Risk Score: ${report.riskScore}%* (HIGH RISK - Immediate Attention Required)

*Critical Health Metrics:*
• Diet: ${report.healthMetrics.diet}/10
• Exercise: ${report.healthMetrics.exercise}/10
• Sleep: ${report.healthMetrics.sleep}/10
• Stress: ${report.healthMetrics.stress}/10

*⚠️ Potential Health Conditions:*
${report.potentialConditions
  .map(
    (condition) => `
• ${condition.condition}
  - Risk Level: ${condition.probability}
  - Risk Factors: ${condition.riskFactors.join(", ")}`
  )
  .join("\n")}

*🔴 IMMEDIATE ACTIONS REQUIRED:*
${report.recommendations.immediate
  .map((rec) => `• ${rec.action} (${rec.priority})`)
  .join("\n")}

*Key Findings:*
${report.keyFindings.map((finding) => `• ${finding}`).join("\n")}

⚕️ *MEDICAL ATTENTION RECOMMENDED*
Please consult a healthcare provider immediately.

Generated by Vitalis Health Assessment System
Time: ${new Date().toLocaleString()}`;
  };

  // Add function to validate phone number
  const validatePhoneNumber = (number) => {
    const phoneRegex = /^[6-9]\d{9}$/; // Indian phone number format
    return phoneRegex.test(number);
  };

  // Add risk assessment helper
  const calculateRiskScore = (responses) => {
    let riskScore = 0;
    let riskFactors = 0;

    responses.forEach((response) => {
      const answer = response.content.toLowerCase();

      // Check for high-risk keywords
      const highRiskKeywords = [
        "severe",
        "extreme",
        "constant",
        "always",
        "unbearable",
        "chest pain",
        "difficulty breathing",
        "unconscious",
        "suicide",
        "heart",
        "emergency",
        "critical",
      ];

      const moderateRiskKeywords = [
        "often",
        "frequent",
        "moderate",
        "sometimes",
        "pain",
        "stress",
        "anxiety",
        "worried",
      ];

      // Increase risk score based on keywords
      highRiskKeywords.forEach((keyword) => {
        if (answer.includes(keyword)) {
          riskScore += 15;
          riskFactors++;
        }
      });

      moderateRiskKeywords.forEach((keyword) => {
        if (answer.includes(keyword)) {
          riskScore += 8;
          riskFactors++;
        }
      });
    });

    // Normalize risk score
    return Math.min(Math.max(riskScore * (1 + riskFactors * 0.1), 0), 100);
  };

  // Update generateFinalReport to use risk assessment
  const generateFinalReport = async () => {
    setIsGeneratingReport(true);
    try {
      // Get all user responses
      const userResponses = conversation.filter(
        (item) => item.type === "answer"
      );

      // Calculate risk score based on responses
      const calculatedRiskScore = calculateRiskScore(userResponses);

      const API_KEY = "AIzaSyCKd_RAkGIkpGUOcyk6WcR04jNXbaj-5wg";

      // Format conversation for analysis
      const allQA = conversation.reduce((pairs, item, index, array) => {
        if (index % 2 === 0) {
          pairs.push({
            question: item.content,
            answer: array[index + 1]?.content || "",
          });
        }
        return pairs;
      }, []);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate a comprehensive health risk assessment report based on the following user profile and responses.
                
                User Profile:
                Age: ${medicalData.personalInfo.age}
                Gender: ${medicalData.personalInfo.gender}
                Medical History: ${
                  medicalData.medicalHistory.conditions.join(", ") || "None"
                }
                Lifestyle: ${JSON.stringify(medicalData.lifestyle)}

                Assessment Responses:
                ${allQA
                  .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
                  .join("\n")}

                Analyze the responses and generate a detailed health risk assessment report.
                Consider:
                - Overall health risk score (1-100)
                - Key health metrics
                - Potential health conditions
                - Risk factors
                - Preventive recommendations
                - Lifestyle suggestions
                
                Return in exact JSON format:
                {
                  "riskScore": <number>,
                  "summary": "<comprehensive health status summary>",
                  "healthMetrics": {
                    "diet": <1-10>,
                    "exercise": <1-10>,
                    "sleep": <1-10>,
                    "stress": <1-10>,
                    "lifestyle": <1-10>
                  },
                  "potentialConditions": [
                    {
                      "condition": "<condition name>",
                      "probability": "Low/Medium/High",
                      "summary": "<condition specific summary>",
                      "riskFactors": ["<risk factor 1>", "<risk factor 2>"],
                      "preventiveMeasures": ["<measure 1>", "<measure 2>"]
                    }
                  ],
                  "keyFindings": ["<finding 1>", "<finding 2>"],
                  "riskIndicators": [
                    {
                      "description": "<indicator description>",
                      "level": "low/medium/high"
                    }
                  ],
                  "recommendations": {
                    "immediate": [
                      {
                        "action": "<action description>",
                        "priority": "High/Medium/Low",
                        "timeframe": "<timeframe>"
                      }
                    ],
                    "lifestyle": {
                      "diet": ["<diet recommendation 1>"],
                      "exercise": ["<exercise recommendation 1>"],
                      "sleep": ["<sleep recommendation 1>"],
                      "stress": ["<stress recommendation 1>"]
                    }
                  }
                }`,
                  },
                ],
              },
            ],
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_NONE",
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1000,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      const text = data.candidates[0].content.parts[0].text;
      console.log("Raw text:", text);

      // Find and parse the JSON object
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }

      const cleanJson = jsonMatch[0]
        .replace(/```json\s*|\s*```/g, "")
        .replace(/\\"/g, '"')
        .trim();

      console.log("Cleaned JSON string:", cleanJson);

      const reportData = JSON.parse(cleanJson);
      console.log("Parsed report data:", reportData);

      // Validate the report structure
      if (
        !reportData.riskScore ||
        !reportData.summary ||
        !reportData.healthMetrics
      ) {
        throw new Error("Invalid report format");
      }

      // Update the risk score in the report data
      const updatedReportData = {
        ...reportData,
        riskScore: Math.max(calculatedRiskScore, reportData.riskScore || 0),
      };

      // Show emergency button for high risk
      if (updatedReportData.riskScore > 70) {
        setShowEmergencyButton(true);
      } else {
        setShowEmergencyButton(false);
      }

      // Store complete assessment data
      const completeAssessment = {
        formData: {
          userProfile: {
            age: medicalData.personalInfo.age,
            gender: medicalData.personalInfo.gender,
            medicalHistory: medicalData.medicalHistory.conditions,
            lifestyle: medicalData.lifestyle,
          },
          assessmentAnswers: allQA,
          timestamp: new Date().toISOString(),
        },
        reportData: updatedReportData,
        metadata: {
          generatedAt: new Date().toISOString(),
          version: "1.0",
          assessmentId: `HA-${Date.now()}`,
        },
      };

      // Save to localStorage for persistence
      localStorage.setItem(
        "healthAssessmentReport",
        JSON.stringify(updatedReportData)
      );
      localStorage.setItem(
        "completeHealthAssessment",
        JSON.stringify(completeAssessment)
      );

      setAssessmentReport(updatedReportData);
      return updatedReportData;
    } catch (err) {
      console.error("Error generating final report:", err);
      setShowEmergencyButton(false);
      setIsGeneratingReport(false);
      throw new Error("Failed to generate health assessment report");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Add a function to retrieve stored assessment data
  const getStoredAssessment = () => {
    try {
      const storedAssessment = localStorage.getItem("completeHealthAssessment");
      if (storedAssessment) {
        const parsedAssessment = JSON.parse(storedAssessment);
        console.log("Retrieved stored assessment:", parsedAssessment);
        return parsedAssessment;
      }
      return null;
    } catch (err) {
      console.error("Error retrieving stored assessment:", err);
      return null;
    }
  };

  // Add this to your useEffect or wherever appropriate
  useEffect(() => {
    const storedAssessment = getStoredAssessment();
    if (storedAssessment) {
      console.log("Found previous assessment:", storedAssessment);
    }
  }, []);

  // Add a cleanup function
  const clearStoredAssessment = () => {
    try {
      localStorage.removeItem("healthAssessmentReport");
      localStorage.removeItem("healthAssessmentForm");
      localStorage.removeItem("completeHealthAssessment");
      console.log("Assessment data cleared from localStorage");
    } catch (err) {
      console.error("Error clearing stored assessment:", err);
    }
  };

  // Add this to your component cleanup
  useEffect(() => {
    return () => {
      // Optionally clear data when component unmounts
      // clearStoredAssessment();
    };
  }, []);

  const handleSubmitResponse = async () => {
    try {
      setProcessingResponse(true);
      // Add current Q&A to conversation
      setConversation((prev) => [
        ...prev,
        {
          type: "question",
          content: currentQuestion.text,
          options: currentQuestion.options,
        },
        {
          type: "answer",
          content: userResponse,
        },
      ]);

      // Clear current response
      setUserResponse("");

      if (currentQuestionNumber >= totalQuestions) {
        await generateFinalReport();
        setIsComplete(true);
      } else {
        // Increment question number and show loading state
        setCurrentQuestionNumber((prev) => prev + 1);
        setCurrentQuestion(null);
        setIsLoadingQuestion(true);

        // Wait before generating next question
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await generateNextQuestion();
      }

      setProcessingResponse(false);
    } catch (error) {
      console.error("Error in handleSubmitResponse:", error);
      setProcessingResponse(false);
      toast.error(
        "An error occurred while processing your response. Please try again."
      );
    }
  };

  const handleUnderwriterAction = (action) => {
    let message = "";
    let toastConfig = {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    };

    switch (action) {
      case "pass":
        toast.success(
          "Application Passed: Risk assessment approved by underwriter",
          toastConfig
        );
        break;
      case "review":
        toast.warning(
          "Application Under Review: Additional verification required",
          toastConfig
        );
        break;
      case "cancel":
        toast.error(
          "Application Cancelled: Risk assessment declined by underwriter",
          toastConfig
        );
        break;
      default:
        toast.info("Invalid action", toastConfig);
    }

    // Store the underwriter's decision
    localStorage.setItem(
      "underwriterDecision",
      JSON.stringify({
        decision: action,
        timestamp: new Date().toISOString(),
        assessmentId: assessmentReport?.metadata?.assessmentId,
      })
    );

    // Close the modal
    setShowUnderwriterModal(false);

    // Navigate after a short delay to allow the toast to be visible
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  // Add this function to generate insights based on responses
  const generateUnderwriterInsights = () => {
    const insights = {
      riskFactors: [],
      recommendations: [],
      underwritingDecision: "",
      additionalNotes: [],
    };

    // Analyze responses
    conversation.forEach((qa, index) => {
      if (index % 2 === 0) {
        // Questions
        const answer = conversation[index + 1]?.content;
        // Add logic to analyze responses and generate insights
        if (answer) {
          // Example analysis based on response patterns
          if (
            answer.toLowerCase().includes("pain") ||
            answer.toLowerCase().includes("severe")
          ) {
            insights.riskFactors.push(
              "Reported significant pain or severe symptoms"
            );
          }
          if (
            answer.toLowerCase().includes("medication") ||
            answer.toLowerCase().includes("treatment")
          ) {
            insights.additionalNotes.push("Currently under medical treatment");
          }
        }
      }
    });

    return insights;
  };

  // Add this new component for the Underwriter Modal
  const UnderwriterModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
      >
        <h3 className="text-2xl font-poppins font-semibold text-gray-800 mb-6">
          Underwriter Decision
        </h3>
        <div className="space-y-4">
          <button
            onClick={() => handleUnderwriterAction("pass")}
            className="w-full py-3 px-6 bg-green-500 text-white rounded-xl font-poppins hover:bg-green-600 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => handleUnderwriterAction("review")}
            className="w-full py-3 px-6 bg-yellow-500 text-white rounded-xl font-poppins hover:bg-yellow-600 transition-colors"
          >
            Review
          </button>
          <button
            onClick={() => handleUnderwriterAction("cancel")}
            className="w-full py-3 px-6 bg-red-500 text-white rounded-xl font-poppins hover:bg-red-600 transition-colors"
          >
            Cancel
          </button>
        </div>
        <button
          onClick={() => setShowUnderwriterModal(false)}
          className="mt-6 w-full py-2 text-gray-600 hover:text-gray-800 font-poppins transition-colors"
        >
          Close
        </button>
      </motion.div>
    </div>
  );

  // Add a loading screen component
  const LoadingScreen = ({ message }) => (
    <div className="min-h-screen bg-[#e3f2fd] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/40 backdrop-blur-lg rounded-2xl shadow-[2px_2px_4px_rgba(255,255,255,0.2)] p-8 text-center"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bbdefb] mx-auto mb-4"></div>
        <p className="text-gray-600 font-poppins text-lg">{message}</p>
        <p className="text-gray-500 font-poppins text-sm mt-2">
          Please wait...
        </p>
      </motion.div>
    </div>
  );

  // Separate EmergencyContactModal into its own component with local state
  const EmergencyContactModal = () => {
    // Use local state for the form
    const [localContact, setLocalContact] = useState("");
    const [isValidContact, setIsValidContact] = useState(false);

    const handleNumberChange = (e) => {
      const number = e.target.value.replace(/\D/g, "").slice(0, 10);
      setLocalContact(number);
      setIsValidContact(number.length === 10);
    };

    const handleSubmit = () => {
      if (isValidContact) {
        const formattedReport = formatReportForWhatsApp(assessmentReport);
        const whatsappUrl = `https://wa.me/91${localContact}?text=${encodeURIComponent(
          formattedReport
        )}`;
        window.open(whatsappUrl, "_blank");
        toast.success("Emergency report shared via WhatsApp");
        setShowEmergencyModal(false);
      } else {
        toast.error("Please enter a valid contact number");
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-poppins font-semibold text-red-600">
              Emergency Contact
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Number (India)
              </label>
              <input
                type="tel"
                value={localContact}
                onChange={handleNumberChange}
                placeholder="Enter 10-digit mobile number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength="10"
              />
              {localContact && !isValidContact && (
                <p className="text-red-500 text-sm mt-1">
                  Please enter a valid 10-digit Indian mobile number
                </p>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleSubmit}
                disabled={!isValidContact}
                className={`flex-1 py-3 px-4 rounded-xl font-poppins font-medium transition-all duration-300 
                  ${
                    isValidContact
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                Share Emergency Report
              </button>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-poppins font-medium hover:bg-gray-200 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // Update EmergencyButton component
  const EmergencyButton = () => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setShowEmergencyModal(true)}
      className="w-full mt-4 py-4 px-6 bg-gradient-to-r from-red-500 to-red-600 
        text-white rounded-xl font-poppins font-medium shadow-lg hover:shadow-xl 
        transition-all duration-300 flex items-center justify-center space-x-3"
    >
      <div className="w-10 h-10 bg-red-400/20 rounded-full flex items-center justify-center">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <span className="text-lg">Share Emergency Report</span>
    </motion.button>
  );

  // Early return for loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#e3f2fd]">
        <div className="text-center bg-white/40 backdrop-blur-lg p-8 rounded-2xl shadow-[2px_2px_4px_rgba(255,255,255,0.2)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bbdefb] mx-auto mb-4"></div>
          <p className="text-gray-600 font-poppins">
            Loading your health assessment...
          </p>
        </div>
      </div>
    );
  }

  // Early return for error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e3f2fd]">
        <div className="bg-white/40 backdrop-blur-lg p-8 rounded-2xl shadow-[2px_2px_4px_rgba(255,255,255,0.2)] max-w-md w-full">
          <h3 className="text-red-600 font-poppins font-semibold mb-4">
            Error
          </h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[#bbdefb] text-gray-700 py-2 rounded-lg hover:bg-[#90caf9] transition-colors duration-300 font-poppins"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Early return if no medical data
  if (!medicalData) {
    return (
      <div className="min-h-screen bg-[#e3f2fd] flex items-center justify-center">
        <motion.div
          className="bg-white/40 backdrop-blur-lg rounded-2xl shadow-[2px_2px_4px_rgba(255,255,255,0.2)] p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bbdefb] mx-auto mb-4"></div>
          <p className="text-gray-600 font-poppins">
            Loading your assessment...
          </p>
        </motion.div>
      </div>
    );
  }

  // Render the completion screen with risk score and conditions
  if (isComplete && assessmentReport) {
    const healthMetrics = assessmentReport.healthMetrics || {};
    const recommendations = assessmentReport.recommendations || {};
    const potentialConditions = assessmentReport.potentialConditions || [];

    // Prepare chart data
    const riskChartData = {
      labels: ["Risk Score", "Safe Zone"],
      datasets: [
        {
          data: [
            assessmentReport.riskScore || 0,
            100 - (assessmentReport.riskScore || 0),
          ],
          backgroundColor: [
            parseInt(assessmentReport.riskScore) > 70
              ? "#EF4444"
              : parseInt(assessmentReport.riskScore) > 40
              ? "#F59E0B"
              : "#10B981",
            "#E5E7EB",
          ],
          borderWidth: 0,
        },
      ],
    };

    const healthMetricsData = {
      labels: ["Diet", "Exercise", "Sleep", "Stress Management"],
      datasets: [
        {
          label: "Health Metrics",
          data: [
            healthMetrics.diet,
            healthMetrics.exercise,
            healthMetrics.sleep,
            healthMetrics.stress,
          ],
          backgroundColor: [
            "rgba(75, 192, 192, 0.7)",
            "rgba(54, 162, 235, 0.7)",
            "rgba(153, 102, 255, 0.7)",
            "rgba(255, 159, 64, 0.7)",
          ],
          borderColor: [
            "rgba(75, 192, 192, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };

    const healthMetricsOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          ticks: {
            stepSize: 2,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `Score: ${context.raw}/10`;
            },
          },
        },
      },
    };

    const renderRecommendations = () => {
      if (!assessmentReport?.recommendations) return null;

      const { immediate = [], lifestyle = {} } =
        assessmentReport.recommendations;

      return (
        <div className="space-y-6">
          {/* Immediate Actions */}
          {immediate.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Priority Actions
              </h3>
              <div className="space-y-4">
                {immediate.map((action, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg ${
                      action.priority === "High"
                        ? "bg-red-50"
                        : action.priority === "Medium"
                        ? "bg-yellow-50"
                        : "bg-green-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">
                        {action.action}
                      </span>
                      <span
                        className={`text-sm ${
                          action.priority === "High"
                            ? "text-red-600"
                            : action.priority === "Medium"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {action.priority} Priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Timeframe: {action.timeframe}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lifestyle Recommendations */}
          {Object.keys(lifestyle).length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Lifestyle Recommendations
              </h3>
              {Object.entries(lifestyle).map(
                ([category, recommendations]) =>
                  recommendations &&
                  recommendations.length > 0 && (
                    <div key={category} className="mb-4 last:mb-0">
                      <h4 className="font-medium text-gray-800 capitalize mb-2">
                        {category}
                      </h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {recommendations.map((rec, idx) => (
                          <li key={idx} className="text-gray-600">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
              )}
            </div>
          )}
        </div>
      );
    };

    // Add this animation variants object
    const fadeInUp = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    };

    return (
      <>
        <ToastContainer />
        <div className="min-h-screen bg-[#e3f2fd] py-12">
          <motion.div
            className="max-w-6xl mx-auto px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header Section with Underwriter Button */}
            {assessmentReport && (
              <motion.div
                className="bg-white/40 backdrop-blur-lg rounded-2xl shadow-[2px_2px_4px_rgba(255,255,255,0.2)] p-8 mb-6"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-poppins text-4xl font-bold text-gray-800">
                    Health Assessment Report
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#bbdefb] text-gray-700 px-6 py-3 rounded-xl font-poppins font-medium 
                      hover:bg-[#90caf9] transition-colors duration-300 shadow-lg hover:shadow-xl"
                    onClick={() => setShowUnderwriterModal(true)}
                  >
                    View Underwriter Insights
                  </motion.button>
                </div>
                <p className="text-gray-600 font-poppins">
                  {assessmentReport.summary}
                </p>
              </motion.div>
            )}

            {/* Response-based Risk Analysis */}
            {assessmentReport && (
              <motion.div
                className="bg-white/40 backdrop-blur-lg rounded-2xl shadow-[2px_2px_4px_rgba(255,255,255,0.2)] p-8 mb-6"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3 className="text-2xl font-poppins font-semibold text-gray-800 mb-6">
                  Response Analysis
                </h3>
                <div className="space-y-4">
                  {conversation.map((item, index) => {
                    if (index % 2 === 0) {
                      // Questions
                      const answer = conversation[index + 1]?.content;
                      return (
                        <motion.div
                          key={index}
                          initial={{
                            opacity: 0,
                            x: -20,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          transition={{
                            duration: 0.5,
                            delay: index * 0.1,
                          }}
                          className="bg-white/60 rounded-xl p-4"
                        >
                          <p className="font-poppins font-medium text-gray-700 mb-2">
                            {item.content}
                          </p>
                          <p className="font-poppins text-gray-600 ml-4">
                            {answer}
                          </p>
                        </motion.div>
                      );
                    }
                    return null;
                  })}
                </div>
              </motion.div>
            )}

            {/* Risk Score and Metrics */}
            {assessmentReport && assessmentReport.healthMetrics && (
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {/* Risk Score */}
                <div className="lg:col-span-6 bg-white/40 backdrop-blur-lg rounded-2xl shadow-[2px_2px_4px_rgba(255,255,255,0.2)] p-8">
                  <h3 className="text-2xl font-poppins font-semibold text-gray-800 mb-6">
                    Overall Health Risk
                  </h3>
                  <div className="relative h-48 flex items-center justify-center">
                    <div
                      className={`text-6xl font-bold font-poppins ${
                        assessmentReport.riskScore > 70
                          ? "text-red-500"
                          : assessmentReport.riskScore > 40
                          ? "text-yellow-500"
                          : "text-green-500"
                      }`}
                    >
                      {assessmentReport.riskScore}%
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-full opacity-20"></div>
                  </div>
                </div>

                {/* Health Metrics */}
                <div className="lg:col-span-6 bg-white/40 backdrop-blur-lg rounded-2xl shadow-[2px_2px_4px_rgba(255,255,255,0.2)] p-8">
                  <h3 className="text-2xl font-poppins font-semibold text-gray-800 mb-6">
                    Health Metrics
                  </h3>
                  {Object.entries(assessmentReport.healthMetrics).map(
                    ([metric, score], index) => (
                      <motion.div
                        key={metric}
                        className="mb-6 last:mb-0"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: index * 0.1,
                        }}
                      >
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-700 font-poppins capitalize">
                            {metric}
                          </span>
                          <span className="text-[#bbdefb] font-poppins font-medium">
                            {score}/10
                          </span>
                        </div>
                        <div className="w-full bg-white/30 rounded-full h-2">
                          <motion.div
                            className="bg-[#bbdefb] h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${score * 10}%`,
                            }}
                            transition={{
                              duration: 0.8,
                              delay: index * 0.1,
                            }}
                          />
                        </div>
                      </motion.div>
                    )
                  )}
                </div>
              </motion.div>
            )}

            {/* Potential Conditions */}
            {assessmentReport?.potentialConditions?.length > 0 && (
              <motion.div
                className="bg-white/40 backdrop-blur-lg rounded-2xl shadow-[2px_2px_4px_rgba(255,255,255,0.2)] p-8 mb-6"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h3 className="text-2xl font-poppins font-semibold text-gray-800 mb-6">
                  Health Risks
                </h3>
                <div className="space-y-6">
                  {assessmentReport.potentialConditions.map(
                    (condition, idx) => (
                      <motion.div
                        key={idx}
                        className="border-b border-white/20 pb-6 last:border-0"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: idx * 0.1,
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xl font-poppins font-medium text-gray-800">
                            {condition.condition}
                          </h4>
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-poppins font-medium ${
                              condition.probability === "High"
                                ? "bg-red-100 text-red-800"
                                : condition.probability === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {condition.probability} Risk
                          </span>
                        </div>
                        <p className="text-gray-600 font-poppins mb-4">
                          {condition.summary}
                        </p>
                        {condition.riskFactors?.length > 0 && (
                          <div className="mt-4">
                            <h5 className="font-poppins font-medium text-gray-700 mb-2">
                              Risk Factors:
                            </h5>
                            <ul className="list-disc pl-5 space-y-2">
                              {condition.riskFactors.map((factor, i) => (
                                <li
                                  key={i}
                                  className="text-gray-600 font-poppins"
                                >
                                  {factor}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )
                  )}
                </div>
              </motion.div>
            )}

            {/* Recommendations */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {renderRecommendations()}
            </motion.div>

            {/* Add a section for detailed insights */}
            {assessmentReport && (
              <motion.div
                className="bg-white/40 backdrop-blur-lg rounded-2xl shadow-[2px_2px_4px_rgba(255,255,255,0.2)] p-8 mb-6"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <h3 className="text-2xl font-poppins font-semibold text-gray-800 mb-6">
                  Assessment Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/60 rounded-xl p-6">
                    <h4 className="font-poppins font-medium text-gray-800 mb-4">
                      Key Findings
                    </h4>
                    <ul className="space-y-2">
                      {assessmentReport.keyFindings?.map((finding, idx) => (
                        <li
                          key={idx}
                          className="flex items-center text-gray-600 font-poppins"
                        >
                          <span className="w-2 h-2 bg-[#bbdefb] rounded-full mr-3"></span>
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white/60 rounded-xl p-6">
                    <h4 className="font-poppins font-medium text-gray-800 mb-4">
                      Risk Indicators
                    </h4>
                    <ul className="space-y-2">
                      {assessmentReport.riskIndicators?.map(
                        (indicator, idx) => (
                          <li
                            key={idx}
                            className="flex items-center text-gray-600 font-poppins"
                          >
                            <span
                              className={`w-2 h-2 rounded-full mr-3 ${
                                indicator.level === "high"
                                  ? "bg-red-500"
                                  : indicator.level === "medium"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                            ></span>
                            {indicator.description}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {NearbyHospitalsOSM && <NearbyHospitalsOSM />}

            {/* Emergency Button */}
            {assessmentReport.riskScore > 70 && <EmergencyButton />}
          </motion.div>

          {/* Add the modal */}
          {showUnderwriterModal && <UnderwriterModal />}
          {showEmergencyModal && <EmergencyContactModal />}
        </div>
      </>
    );
  } else if (isComplete) {
    if (isGeneratingReport) {
      return (
        <LoadingScreen message="Generating your comprehensive health assessment report..." />
      );
    }

    if (assessmentReport) {
      return (
        <>
          {/* Existing completion screen JSX */}
          {/* ... */}
          {/* Update the Underwriter Insights button onClick */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#bbdefb] text-gray-700 px-6 py-3 rounded-xl font-poppins font-medium 
              hover:bg-[#90caf9] transition-colors duration-300 shadow-lg hover:shadow-xl"
            onClick={() => setShowUnderwriterModal(true)}
          >
            View Underwriter Insights
          </motion.button>
          {/* ... rest of the completion screen ... */}

          {/* Add the modal */}
          {showUnderwriterModal && <UnderwriterModal />}
          {showEmergencyModal && <EmergencyContactModal />}
        </>
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#e3f2fd] py-12">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="bg-white/40 backdrop-blur-lg rounded-2xl shadow-[2px_2px_4px_rgba(255,255,255,0.2)] p-6 mb-6">
          <div className="mb-4">
            <div className="h-2 bg-white/30 rounded-full">
              <div
                className="h-full bg-[#bbdefb] rounded-full transition-all duration-500 ease-in-out"
                style={{
                  width: `${(currentQuestionNumber / totalQuestions) * 100}%`,
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 font-poppins">
              Question {currentQuestionNumber} of {totalQuestions}
            </p>
          </div>
        </div>

        {/* Loading States */}
        {isGeneratingReport ? (
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl shadow-[2px_2px_4px_rgba(255,255,255,0.2)] p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bbdefb] mx-auto mb-4"></div>
            <p className="text-gray-600 font-poppins text-lg">
              Generating your comprehensive health assessment report...
            </p>
            <p className="text-gray-500 font-poppins text-sm mt-2">
              Please wait while we analyze your responses
            </p>
          </div>
        ) : isLoadingQuestion || processingResponse ? (
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl shadow-[2px_2px_4px_rgba(255,255,255,0.2)] p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bbdefb] mx-auto mb-4"></div>
            <p className="text-gray-600 font-poppins text-lg">
              {isLoadingQuestion
                ? "Preparing your next question..."
                : "Processing your response..."}
            </p>
            <p className="text-gray-500 font-poppins text-sm mt-2">
              Please wait a moment
            </p>
          </div>
        ) : currentQuestion ? (
          /* Question Card */
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl shadow-[2px_2px_4px_rgba(255,255,255,0.2)] p-8">
            <div className="space-y-6">
              <h3 className="text-xl font-poppins font-semibold text-gray-800 mb-6">
                {currentQuestion.text}
              </h3>

              {renderQuestion()}
            </div>
          </div>
        ) : null}

        {/* Submit Button */}
        {currentQuestion && !isLoadingQuestion && !processingResponse && (
          <div className="mt-6">
            <button
              onClick={handleSubmitResponse}
              disabled={!userResponse.trim()}
              className={`w-full py-3 px-6 rounded-xl font-poppins font-medium transition-all duration-300 
                ${
                  userResponse.trim()
                    ? "bg-[#bbdefb] text-gray-700 hover:bg-[#90caf9] shadow-lg hover:shadow-xl"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
            >
              Submit Response
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicQuestions;
