import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mic } from "lucide-react";

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
  }, [options.interimResults, options.lang, options.continuous, isListening]);

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
  const initialQuestion = {
    text: "What brings you to see a doctor today?",
    type: "radio",
    options: [
      "Chest Pain",
      "Headache",
      "Stomach Issues",
      "Anxiety/Depression",
      "Regular Checkup",
      "Other",
    ],
  };

  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion);
  const [userResponses, setUserResponses] = useState([]);
  const [response, setResponse] = useState("");
  const [otherResponse, setOtherResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [micError, setMicError] = useState(null);
  const [shouldRestart, setShouldRestart] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Initialize Gemini API
  const genAI = new GoogleGenerativeAI(
    "AIzaSyCKd_RAkGIkpGUOcyk6WcR04jNXbaj-5wg"
  );

  const {
    isListening: externalListening,
    transcript,
    error,
    startListening,
    stopListening,
  } = useSpeechToText({
    continuous: false,
    interimResults: true,
    lang: "en-US",
  });

  // Initialize speech recognition on component mount
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      setMicError("Speech recognition is not supported in your browser");
      return;
    }

    try {
      const recognitionInstance = new window.webkitSpeechRecognition();

      // Configure recognition settings
      recognitionInstance.continuous = false; // Changed to false to prevent loops
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-US";

      // Set up event handlers
      recognitionInstance.onstart = () => {
        setIsListening(true);
        setMicError(null);
        console.log("Started listening...");
      };

      recognitionInstance.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          console.log("Final transcript:", finalTranscript);
          setResponse(finalTranscript);
          setShouldRestart(false); // Don't restart after getting final result
        } else if (interimTranscript) {
          console.log("Interim transcript:", interimTranscript);
          setResponse(interimTranscript);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error("Recognition error:", event.error);
        setMicError(`Error: ${event.error}. Please try again.`);
        setIsListening(false);
        setShouldRestart(false); // Don't restart on error
      };

      recognitionInstance.onend = () => {
        console.log("Recognition ended");
        setIsListening(false);

        // Only restart if explicitly set to do so
        if (shouldRestart) {
          try {
            setTimeout(() => {
              recognitionInstance.start();
            }, 200);
          } catch (e) {
            console.error("Failed to restart recognition:", e);
            setShouldRestart(false);
          }
        }
      };

      setRecognition(recognitionInstance);
    } catch (error) {
      console.error("Error initializing speech recognition:", error);
      setMicError("Failed to initialize speech recognition");
    }
  }, []);

  const handleVoiceInput = async () => {
    if (!recognition) {
      setMicError("Speech recognition is not supported");
      return;
    }

    try {
      if (!isListening) {
        // Request microphone permission first
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop()); // Stop the stream immediately

        // Start recognition
        setShouldRestart(true); // Allow restarts when manually started
        recognition.start();
        const micButton = document.querySelector(".mic-button");
        if (micButton) {
          micButton.classList.add("text-blue-500", "animate-pulse");
        }
      } else {
        setShouldRestart(false); // Prevent restarts when manually stopped
        recognition.stop();
        const micButton = document.querySelector(".mic-button");
        if (micButton) {
          micButton.classList.remove("text-blue-500", "animate-pulse");
        }
        setIsListening(false);
      }
    } catch (error) {
      console.error("Microphone error:", error);
      setMicError("Please allow microphone access to use voice input");
      setIsListening(false);
      setShouldRestart(false);
    }
  };

  // Update response when transcript changes
  useEffect(() => {
    if (transcript) {
      setResponse(transcript);
    }
  }, [transcript]);

  // Effect to log state changes
  useEffect(() => {
    console.log("Current Question:", currentQuestion);
    console.log("Loading State:", loading);
  }, [currentQuestion, loading]);

  const generateNextQuestion = async (currentResponse) => {
    if (userResponses.length >= 6) {
      // Check if we've reached 7 questions (including current)
      setIsComplete(true);
      return;
    }

    setLoading(true);
    let newQuestion = null;

    try {
      const finalResponse =
        response === "Other" ? otherResponse : currentResponse;
      const newResponses = [
        ...userResponses,
        { question: currentQuestion.text, answer: finalResponse },
      ];
      setUserResponses(newResponses);

      const context = newResponses
        .map((r) => `Q: ${r.question}\nA: ${r.answer}`)
        .join("\n");

      const prompt = `You are a medical risk assessment AI. Based on these previous responses:
      ${context}
      
      Current question number: ${newResponses.length + 1}
      Maximum questions: 7
      Questions remaining: ${7 - newResponses.length}
      
      ${
        newResponses.length === 2 || newResponses.length === 4
          ? "Generate a text input question for detailed information."
          : "Generate a multiple choice question."
      }
      
      Focus on:
      1. Primary symptoms and severity
      2. Key risk factors (age, smoking, weight)
      3. Family history of serious conditions
      4. Current medications and allergies
      5. Lifestyle factors

      For multiple choice use:
      {
        "question": "Write a specific risk assessment question",
        "type": "radio",
        "options": ["option1", "option2", "option3", "option4", "Other"]
      }
      
      For text input use:
      {
        "question": "Ask for specific important details",
        "type": "text",
        "options": []
      }

      If this is the final question or reached 7 questions, respond with:
      {
        "complete": true,
        "risk_score": number between 0-100,
        "risk_factors": ["list", "of", "identified", "risks"],
        "potential_conditions": [
          {
            "condition": "name of condition",
            "probability": "percentage",
            "summary": "brief description and why it's suspected"
          }
        ],
        "recommendations": ["list", "of", "recommendations"]
      }`;

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const geminiResponse = await result.response.text();

      console.log("Raw Gemini response:", geminiResponse);

      try {
        const parsedResponse = JSON.parse(geminiResponse.trim());
        console.log("Parsed response:", parsedResponse);

        if (parsedResponse.complete) {
          setIsComplete(true);
          setCurrentQuestion(null);
          localStorage.setItem(
            "riskAssessment",
            JSON.stringify({
              responses: newResponses,
              riskScore: parsedResponse.risk_score,
              riskFactors: parsedResponse.risk_factors,
              potentialConditions: parsedResponse.potential_conditions,
              recommendations: parsedResponse.recommendations,
            })
          );
        } else {
          // Create new question object
          newQuestion = {
            text: parsedResponse.question || "Error loading question",
            type: parsedResponse.type || "radio",
            options: parsedResponse.options || ["Retry", "Start Over"],
            category: parsedResponse.category,
          };
        }

        // Wait for a moment to ensure state updates are complete
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (newQuestion) {
          setCurrentQuestion(newQuestion);
          setResponse("");
          setOtherResponse("");
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        newQuestion = {
          text: "There was an error loading the question. Would you like to:",
          type: "radio",
          options: ["Try Again", "Start Over"],
        };
        setCurrentQuestion(newQuestion);
      }
    } catch (error) {
      console.error("Error:", error);
      newQuestion = {
        text: "Sorry, there was an error. Please try again.",
        type: "radio",
        options: ["Retry", "Start Over"],
      };
      setCurrentQuestion(newQuestion);
    } finally {
      // Ensure loading state is only cleared after everything is ready
      await new Promise((resolve) => setTimeout(resolve, 300));
      setLoading(false);
    }
  };

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
          <div className="relative">
            <input
              type="text"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={
                isListening
                  ? "Listening..."
                  : "Type your answer here or click the microphone to speak"
              }
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`mic-button absolute right-3 top-1/2 transform -translate-y-1/2 
                ${
                  isListening ? "text-blue-500 animate-pulse" : "text-gray-400"
                } 
                hover:text-blue-500 focus:outline-none transition-colors duration-200`}
            >
              <Mic className="w-5 h-5" />
              {isListening && (
                <span className="absolute -top-2 -right-2 h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </button>
            {micError && (
              <p className="text-red-500 text-sm mt-1">{micError}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      if (recognition) {
        setShouldRestart(false);
        recognition.stop();
        setIsListening(false);
      }
    };
  }, [recognition]);

  // Modified completion screen with risk score and conditions
  if (isComplete) {
    const assessment = JSON.parse(localStorage.getItem("riskAssessment"));
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Health Risk Assessment Report
        </h2>

        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-3">Risk Score:</h3>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                  Risk Level
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {assessment.riskScore}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div
                style={{ width: `${assessment.riskScore}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
              ></div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-3">
            Potential Health Conditions:
          </h3>
          {assessment.potentialConditions.map((condition, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800">
                {condition.condition}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Probability: {condition.probability}
              </p>
              <p className="text-sm text-gray-600 mt-2">{condition.summary}</p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-3">
            Risk Factors Identified:
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            {assessment.riskFactors.map((risk, index) => (
              <li key={index} className="text-gray-600">
                {risk}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-3">Recommendations:</h3>
          <ul className="list-disc pl-5 space-y-2">
            {assessment.recommendations.map((rec, index) => (
              <li key={index} className="text-gray-600">
                {rec}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <h3 className="font-medium text-gray-700 mb-3">Your Responses:</h3>
          {assessment.responses.map((item, index) => (
            <div key={index} className="mt-2 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-800">{item.question}</p>
              <p className="text-gray-600 mt-1">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-8">
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${(userResponses.length / 7) * 100}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-600 text-right">
          Question {userResponses.length + 1} of 7
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          <div className="flex space-x-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
          </div>
          <p className="text-gray-600">Generating next question...</p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const finalResponse =
              response === "Other" ? otherResponse : response;
            if (response && (response !== "Other" || otherResponse)) {
              generateNextQuestion(finalResponse);
            }
          }}
        >
          {renderQuestion()}

          {currentQuestion && (
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={!response || (response === "Other" && !otherResponse)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  !response || (response === "Other" && !otherResponse)
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default DynamicQuestions;
