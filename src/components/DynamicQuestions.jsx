import React, { useState, useEffect, useRef, useCallback } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mic } from "lucide-react";
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

  const recognitionRef = useRef(null);
  const totalQuestions = 5;

  // Initialize Google AI with a valid API key
  const genAI = new GoogleGenerativeAI(
    "AIzaSyB-azWTWmG-9iP_igzqpNYubHwWJRrGrA8"
  ); // Replace with actual key

  const {
    isListening: externalListening,
    transcript: externalTranscript,
    error: externalError,
    startListening: externalStartListening,
    stopListening: externalStopListening,
  } = useSpeechToText({
    continuous: false,
    interimResults: true,
    lang: "en-US",
  });

  // Add retry counter at component level
  const retryCount = useRef(0);

  // Reset retry counter when starting new assessment
  useEffect(() => {
    retryCount.current = 0;
  }, [currentQuestionNumber]);

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

  const initializeSpeechRecognition = () => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        console.log("Speech recognition started");
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join(" ");

        console.log("Transcript received:", transcript);
        setUserResponse((prev) => {
          const newResponse = prev.trim() + " " + transcript.trim();
          return newResponse.trim();
        });
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log("Speech recognition ended");
      };

      recognitionRef.current = recognition;
    }
  };

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
      // Generate a simple context-aware question
      const getBasicQuestion = () => {
        const conditions = medicalData.medicalHistory.conditions;
        if (currentQuestionNumber === 1 && conditions.length > 0) {
          return {
            text: `How is your ${conditions[0]} affecting you lately?`,
            options: [
              "Well managed",
              "Some challenges",
              "Needs attention",
              "Serious concerns",
            ],
          };
        }
        return {
          text: "How have you been feeling recently?",
          options: ["Very well", "Generally good", "Some concerns", "Not well"],
        };
      };

      const basicQuestion = {
        ...getBasicQuestion(),
        type: currentQuestionNumber === 3 ? "text" : "radio",
        ...(currentQuestionNumber === 3 && {
          text: "What symptoms are you experiencing?",
          placeholder: "Describe your main symptoms...",
        }),
      };

      setCurrentQuestion(basicQuestion);
      setPreviousQuestions((prev) => new Set([...prev, basicQuestion.text]));
      setUserResponse("");
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const handleStartListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        console.log("Starting speech recognition");
      } catch (err) {
        console.error("Error starting speech recognition:", err);
      }
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        console.log("Stopping speech recognition");
      } catch (err) {
        console.error("Error stopping speech recognition:", err);
      }
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
        />
        {window.webkitSpeechRecognition && (
          <button
            onClick={isListening ? handleStopListening : handleStartListening}
            className={`absolute right-3 bottom-3 p-2 rounded-full transition-colors duration-200 
              ${
                isListening
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-600"
              }`}
            type="button"
          >
            <Mic className={`w-5 h-5 ${isListening ? "animate-pulse" : ""}`} />
          </button>
        )}
      </div>
      <div className="flex justify-between text-sm text-gray-500">
        <span>{isListening ? "Listening..." : "Click the mic to speak"}</span>
        <span>{userResponse.length}/500 characters</span>
      </div>
    </div>
  );

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {currentQuestion.text}
        </h2>
        {currentQuestion.type === "radio" ? (
          <div className="space-y-2">
            {currentQuestion.options?.map((option) => (
              <div key={option} className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={option}
                    value={option}
                    checked={response === option}
                    onChange={(e) => {
                      setResponse(e.target.value);
                      if (e.target.value !== "Other") {
                        setOtherResponse("");
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={option} className="text-sm text-gray-700">
                    {option}
                  </label>
                </div>
                {option === "Other" && response === "Other" && (
                  <div className="relative mt-2 ml-6">
                    <input
                      type="text"
                      value={otherResponse}
                      onChange={(e) => setOtherResponse(e.target.value)}
                      placeholder="Please specify"
                      className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          renderTextInput()
        )}
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

  const generateFinalReport = async () => {
    try {
      const API_KEY = "AIzaSyCKd_RAkGIkpGUOcyk6WcR04jNXbaj-5wg";

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
                    text: `Generate a health risk assessment report in JSON format (no markdown, no backticks).

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

                Return a JSON object with this exact structure:
                {
                  "riskScore": <number 1-100>,
                  "summary": "<brief health status>",
                  "healthMetrics": {
                    "diet": <1-10>,
                    "exercise": <1-10>,
                    "sleep": <1-10>,
                    "stress": <1-10>,
                    "lifestyle": <1-10>
                  },
                  "potentialConditions": [
                    {
                      "condition": "<name>",
                      "probability": "Low/Medium/High",
                      "summary": "<brief explanation>",
                      "riskFactors": ["factor1", "factor2"],
                      "preventiveMeasures": ["measure1", "measure2"]
                    }
                  ],
                  "recommendations": {
                    "immediate": [
                      {
                        "action": "<action>",
                        "priority": "High/Medium/Low",
                        "timeframe": "<timeframe>"
                      }
                    ],
                    "lifestyle": {
                      "diet": ["recommendation1", "recommendation2"],
                      "exercise": ["recommendation1", "recommendation2"],
                      "sleep": ["recommendation1", "recommendation2"],
                      "stress": ["recommendation1", "recommendation2"]
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

      // Extract the text and clean it up
      const text = data.candidates[0].content.parts[0].text;
      console.log("Raw text:", text);

      // Find the JSON object in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }

      // Clean the JSON string and parse it
      const cleanJson = jsonMatch[0]
        .replace(/```json\s*|\s*```/g, "") // Remove markdown code blocks
        .replace(/\\"/g, '"') // Fix escaped quotes
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
        reportData,
        metadata: {
          generatedAt: new Date().toISOString(),
          version: "1.0",
          assessmentId: `HA-${Date.now()}`,
        },
      };

      localStorage.setItem(
        "healthAssessmentReport",
        JSON.stringify(reportData)
      );
      localStorage.setItem(
        "completeHealthAssessment",
        JSON.stringify(completeAssessment)
      );

      setAssessmentReport(reportData);
      return reportData;
    } catch (err) {
      console.error("Error generating final report:", err);
      throw new Error("Failed to generate health assessment report");
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
    if (!userResponse.trim()) return;

    setProcessingResponse(true);
    try {
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
        // Increment question number first
        setCurrentQuestionNumber((prev) => prev + 1);

        // Clear current question to show loading state
        setCurrentQuestion(null);

        // Wait for a moment before generating next question
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await generateNextQuestion();
      }
    } catch (err) {
      console.error("Error in handleSubmitResponse:", err);
      setError("An error occurred while processing your response");
    } finally {
      setProcessingResponse(false);
    }
  };

  const handleUnderwriterAction = (action) => {
    let message = "";
    switch (action) {
      case "pass":
        message = "Application Passed: Risk assessment approved by underwriter";
        break;
      case "review":
        message = "Application Under Review: Additional verification required";
        break;
      case "cancel":
        message =
          "Application Cancelled: Risk assessment declined by underwriter";
        break;
      default:
        message = "Invalid action";
    }

    alert(message);
    // Store the underwriter's decision
    localStorage.setItem(
      "underwriterDecision",
      JSON.stringify({
        decision: action,
        timestamp: new Date().toISOString(),
        assessmentId: assessmentReport?.metadata?.assessmentId,
      })
    );

    // Redirect to home page
    navigate("/");
  };

  // Early return for loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your health assessment...</p>
        </div>
      </div>
    );
  }

  // Early return for error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h3 className="text-red-600 font-semibold mb-4">Error</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <h3 className="text-yellow-800 font-semibold mb-2">
            No Medical Data
          </h3>
          <p className="text-yellow-600">
            Please complete the medical form first.
          </p>
          <button
            onClick={() => (window.location.href = "/medical-form")}
            className="mt-4 bg-yellow-100 text-yellow-700 px-4 py-2 rounded hover:bg-yellow-200 transition-colors"
          >
            Go to Medical Form
          </button>
        </div>
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

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Health Risk Assessment Report
            </h2>
            <p className="text-gray-600">{assessmentReport.summary}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Risk Score and Vitals Section */}
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risk Score Doughnut Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Overall Health Risk
                </h3>
                <div className="relative h-64 flex items-center justify-center">
                  <Doughnut
                    data={riskChartData}
                    options={{
                      cutout: "70%",
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              return `Risk Level: ${context.raw}%`;
                            },
                          },
                        },
                      },
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div
                        className={`text-4xl font-bold ${
                          assessmentReport.riskScore > 70
                            ? "text-red-600"
                            : assessmentReport.riskScore > 40
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {assessmentReport.riskScore}%
                      </div>
                      <div className="text-sm text-gray-500">Risk Score</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">Low Risk (0-40%)</span>
                    <span className="text-yellow-600">
                      Medium Risk (41-70%)
                    </span>
                    <span className="text-red-600">High Risk (71-100%)</span>
                  </div>
                </div>
              </div>

              {/* Health Metrics Detail */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Health Metrics Analysis
                </h3>
                <div className="h-64">
                  <Bar
                    data={healthMetricsData}
                    options={{
                      ...healthMetricsOptions,
                      plugins: {
                        ...healthMetricsOptions.plugins,
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const labels = {
                                diet: "Dietary Health",
                                exercise: "Physical Activity",
                                sleep: "Sleep Quality",
                                stress: "Stress Management",
                              };
                              return `${labels[context.label]}: ${
                                context.raw
                              }/10`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Detailed Health Analysis */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Health Risk Analysis
                </h3>
                <div className="space-y-6">
                  {potentialConditions.map((condition, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-200 pb-4 last:border-0"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium text-gray-800">
                          {condition.condition}
                        </h4>
                        <span
                          className={`px-4 py-1 rounded-full text-sm font-medium ${
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
                      <p className="text-gray-600 mb-3">{condition.summary}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">
                            Risk Factors:
                          </h5>
                          <ul className="list-disc pl-5 space-y-1">
                            {condition.riskFactors.map((factor, idx) => (
                              <li key={idx} className="text-gray-600">
                                {factor}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">
                            Prevention Steps:
                          </h5>
                          <ul className="list-disc pl-5 space-y-1">
                            {condition.preventiveMeasures.map(
                              (measure, idx) => (
                                <li key={idx} className="text-gray-600">
                                  {measure}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations and Action Plan */}
            <div className="lg:col-span-4 space-y-6">
              {renderRecommendations()}
            </div>
          </div>

          {/* Underwriter Section */}
          <div className="mt-8">
            <button
              onClick={() => setShowUnderwriterButtons(!showUnderwriterButtons)}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg 
                hover:bg-blue-700 transition-colors duration-200"
            >
              {showUnderwriterButtons
                ? "Hide Underwriter Controls"
                : "Show Underwriter Controls"}
            </button>

            {showUnderwriterButtons && (
              <div className="mt-6 space-y-6">
                {/* Underwriter Summary */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Underwriter's Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">
                        Overall Risk Level
                      </div>
                      <div
                        className={`text-xl font-semibold ${
                          assessmentReport.riskScore > 70
                            ? "text-red-600"
                            : assessmentReport.riskScore > 40
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {assessmentReport.riskScore}% -{" "}
                        {assessmentReport.riskScore > 70
                          ? "High Risk"
                          : assessmentReport.riskScore > 40
                          ? "Medium Risk"
                          : "Low Risk"}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">
                        Risk Factors Identified
                      </div>
                      <div className="text-xl font-semibold text-gray-800">
                        {potentialConditions.length} Conditions
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">
                        Required Actions
                      </div>
                      <div className="text-xl font-semibold text-gray-800">
                        {recommendations.immediate.length} Items
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => handleUnderwriterAction("pass")}
                    className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg 
                      hover:bg-green-600 transition-colors duration-200"
                  >
                    Approve Application
                  </button>
                  <button
                    onClick={() => handleUnderwriterAction("review")}
                    className="flex-1 bg-yellow-500 text-white px-6 py-3 rounded-lg 
                      hover:bg-yellow-600 transition-colors duration-200"
                  >
                    Request Additional Review
                  </button>
                  <button
                    onClick={() => handleUnderwriterAction("cancel")}
                    className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg 
                      hover:bg-red-600 transition-colors duration-200"
                  >
                    Decline Application
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else if (isComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Generating your health assessment report...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-in-out"
                style={{
                  width: `${(currentQuestionNumber / totalQuestions) * 100}%`,
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Question {currentQuestionNumber} of {totalQuestions}
            </p>
          </div>
        </div>

        {/* Question Card */}
        {isLoadingQuestion ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 font-medium">
                Loading your next question...
              </p>
            </div>
          </div>
        ) : processingResponse ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 font-medium">
                Analyzing your response...
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Preparing next question
              </p>
            </div>
          </div>
        ) : currentQuestion ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                {currentQuestion.text}
              </h3>

              {currentQuestion.type === "text" ? (
                renderTextInput()
              ) : (
                <div className="space-y-4">
                  {currentQuestion.options?.map((option, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
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
                          className="ml-3 text-gray-700 cursor-pointer flex-grow"
                        >
                          {option}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Submit Button */}
        {currentQuestion && !isLoadingQuestion && !processingResponse && (
          <div className="mt-6">
            <button
              onClick={handleSubmitResponse}
              disabled={!userResponse.trim()}
              className={`w-full py-3 px-6 rounded-lg text-white font-medium transition-colors duration-200 
                ${
                  userResponse.trim()
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-400 cursor-not-allowed"
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
