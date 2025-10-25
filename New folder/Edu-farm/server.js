const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { YoutubeTranscript } = require("youtube-transcript");

const app = express();
const PORT = 2200;

const YOUTUBE_API_KEY = "AIzaSyCx8h2X3DbB-Cic4VOfJPVgrtmjbgqkab4";
const MONICA_API_KEY = "sk-dWYLG_WvNnGr0w0yRWTyYmB2_9tC3iwdjbR35L0dl6iwVVBXcDfcOQ34-Q9c4pozVN09TG5aVQj2UqwVQjPyIU27fxx1";
const GEMINI_API_KEY = "AIzaSyD_EhQ9ohAdS1ZXbefuUivphrx4A4t4kkc";

const path = require("path");

const quizStore = new Map();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Parse ISO 8601 duration
function parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = parseInt(match[1] || "0") * 3600;
    const minutes = parseInt(match[2] || "0") * 60;
    const seconds = parseInt(match[3] || "0");
    return hours + minutes + seconds;
}

// Helper function to check if a video is likely animated
function isAnimatedVideo(video) {
    const animationKeywords = ["animated", "cartoon", "3D", "2D", "animation"];
    const textToCheck = `${video.snippet.title} ${video.snippet.description} ${video.snippet.tags ? video.snippet.tags.join(" ") : ""}`.toLowerCase();
    
    return animationKeywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, "i");
        return regex.test(textToCheck);
    });
}

// Fetch YouTube video based on video type
async function fetchYouTubeVideo(crop, videoType) {
    let searchQuery;
    let filterFunction = item => parseDuration(item.contentDetails.duration) > 90;

    if (videoType === "animated") {
        searchQuery = `${crop} farming animated tutorial cartoon 3D 2D`;
        filterFunction = item => parseDuration(item.contentDetails.duration) > 90 && isAnimatedVideo(item);
    } else {
        searchQuery = `${crop} farming tutorial agri-tech`;
    }

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&key=${YOUTUBE_API_KEY}`;

    try {
        const searchResponse = await axios.get(searchUrl);
        const videoIds = searchResponse.data.items.map(item => item.id.videoId).join(",");
        const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
        const videosResponse = await axios.get(videosUrl);
        
        const suitableVideos = videosResponse.data.items.filter(filterFunction);

        if (suitableVideos.length > 0) {
            const video = suitableVideos[0];
            console.log(`Found ${videoType} video for "${searchQuery}": ${video.snippet.title}`);
            return {
                title: video.snippet.title,
                videoId: video.id,
                url: `https://www.youtube.com/watch?v=${video.id}`,
                description: video.snippet.description,
                duration: video.contentDetails.duration
            };
        }

        console.warn(`No suitable ${videoType} videos found for "${searchQuery}". Attempting fallback...`);
        
        searchQuery = videoType === "animated" ? `${crop} farming animated tutorial` : `${crop} farming tutorial`;
        const fallbackSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&key=${YOUTUBE_API_KEY}`;
        const fallbackSearchResponse = await axios.get(fallbackSearchUrl);
        const fallbackVideoIds = fallbackSearchResponse.data.items.map(item => item.id.videoId).join(",");
        const fallbackVideosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${fallbackVideoIds}&key=${YOUTUBE_API_KEY}`;
        const fallbackVideosResponse = await axios.get(fallbackVideosUrl);
        
        const fallbackVideos = fallbackVideosResponse.data.items.filter(filterFunction);

        if (fallbackVideos.length > 0) {
            const video = fallbackVideos[0];
            console.log(`Found ${videoType} video in fallback for "${searchQuery}": ${video.snippet.title}`);
            return {
                title: video.snippet.title,
                videoId: video.id,
                url: `https://www.youtube.com/watch?v=${video.id}`,
                description: video.snippet.description,
                duration: video.contentDetails.duration
            };
        }

        console.warn(`No suitable ${videoType} videos found even after fallback for "${crop}".`);
        return {
            title: `No suitable ${videoType} video available`,
            videoId: null,
            url: null,
            description: `No ${videoType} videos found for this crop. Please try a different crop or check back later.`,
            duration: "N/A"
        };
    } catch (error) {
        console.error("YouTube Fetch Error:", error.response?.data || error.message);
        return {
            title: "Video fetch failed",
            videoId: null,
            url: null,
            description: `Unable to fetch ${videoType} video due to API limits or errors. Try again later.`,
            duration: "N/A"
        };
    }
}

// Fetch video transcript
async function fetchVideoTranscript(videoId) {
    if (!videoId) return null;
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        if (!transcript || transcript.length === 0) throw new Error("No transcript available");
        return transcript.map(segment => segment.text).join(" ");
    } catch (error) {
        console.error("Transcript Error:", error.message);
        return null;
    }
}

// Generate summary in the requested language
async function generateSummary(videoData, crop, lang) {
    const monicaApiUrl = "https://openapi.monica.im/v1/chat/completions";
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    let inputText, isMetadataOnly = false;

    if (!videoData.videoId) return lang === "mr" ? "व्हिडिओ उपलब्ध नसल्यामुळे सारांश उपलब्ध नाही." : lang === "hi" ? "वीडियो उपलब्ध न होने के कारण सारांश उपलब्ध नहीं है।" : "Summary unavailable due to missing video.";

    try {
        const transcript = await fetchVideoTranscript(videoData.videoId);
        inputText = transcript || `Title: "${videoData.title}"\nDescription: "${videoData.description}"`;
        isMetadataOnly = !transcript;
    } catch (error) {
        inputText = `Title: "${videoData.title}"\nDescription: "${videoData.description}"`;
        isMetadataOnly = true;
    }

    try {
        const langInstruction = lang === "mr" ? "मराठीत" : lang === "hi" ? "हिन्दी में" : "in English";
        const prompt = isMetadataOnly
            ? `Based on the following title and description, suggest what this agri-tech video might explain in a concise summary related to "${crop}": "${inputText}". Include likely details such as techniques, components, or benefits even if not explicitly stated. If insufficient, provide a general summary about "${crop}" farming. Provide the summary ${langInstruction}.`
            : `Summarize this agri-tech video content based on the following transcript: "${inputText}". Provide the summary ${langInstruction}.`;
        
        const response = await axios.post(monicaApiUrl, {
            model: "gpt-4o",
            messages: [{ role: "user", content: [{ type: "text", text: prompt }] }]
        }, { headers: { "Authorization": `Bearer ${MONICA_API_KEY}`, "Content-Type": "application/json" } });
        return response.data.choices[0].message.content;
    } catch (error) {
        try {
            const langInstruction = lang === "mr" ? "मराठीत" : lang === "hi" ? "हिन्दी में" : "in English";
            const prompt = isMetadataOnly
                ? `Based on the following title and description, suggest what this agri-tech video might explain in a concise summary related to "${crop}": "${inputText}". Include likely details such as techniques, components, or benefits even if not explicitly stated. If insufficient, provide a general summary about "${crop}" farming. Provide the summary ${langInstruction}.`
                : `Summarize this agri-tech video content based on the following transcript: "${inputText}". Provide the summary ${langInstruction}.`;
            const response = await axios.post(geminiApiUrl, { contents: [{ parts: [{ text: prompt }] }] }, { headers: { "Content-Type": "application/json" } });
            return response.data.candidates[0].content.parts[0].text;
        } catch (geminiError) {
            return lang === "mr" ? `हा व्हिडिओ "${crop}" शेतीच्या पैलूंना दर्शवतो असे दिसते...` : lang === "hi" ? `यह वीडियो संभवतः "${crop}" खेती के पहलुओं को दर्शाता है...` : `This video likely demonstrates aspects of ${crop} farming...`;
        }
    }
}

// Generate quiz in the requested language
async function generateQuiz(summary, lang) {
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    if (summary.length < 50 || summary.includes("likely demonstrates") || summary.includes("unavailable")) {
        return { questions: lang === "mr" ? "व्हिडिओ सामग्रीच्या तपशीलांअभावी प्रश्नमंजुषा उपलब्ध नाही." : lang === "hi" ? "वीडियो सामग्री के विवरण के अभाव में क्विज उपलब्ध नहीं है।" : "Quiz unavailable due to insufficient video content details.", quizId: null };
    }

    try {
        const langInstruction = lang === "mr" ? "मराठीत" : lang === "hi" ? "हिन्दी में" : "in English";
        const response = await axios.post(geminiApiUrl, {
            contents: [{
                parts: [{
                    text: `Create a 5-question multiple choice quiz about agri-tech adoption based on this summary: "${summary}". For each question, provide 4 options (a,b,c,d), the correct answer as a single letter (a, b, c, or d), and a brief reason why it’s correct. Provide the quiz ${langInstruction}. Format as: 
                    Q1: [Question]
                    a) [Option]
                    b) [Option]
                    c) [Option]
                    d) [Option]
                    Answer: [a, b, c, or d]
                    Reason: [Explanation]`
                }]
            }]
        }, { headers: { "Content-Type": "application/json" } });
        const fullQuizText = response.data.candidates[0].content.parts[0].text;
        console.log("Generated Quiz:\n", fullQuizText);

        const questions = [];
        const answers = [];
        const lines = fullQuizText.split("\n");
        let currentQuestion = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith("Q")) {
                currentQuestion = { question: line, options: [] };
                questions.push(currentQuestion);
            } else if (line.match(/^[a-d]\)/)) {
                currentQuestion.options.push(line);
            } else if (line.startsWith("Answer:")) {
                const correctAnswer = line.replace("Answer: ", "").trim().replace(/[)\.]/g, "").toLowerCase();
                answers.push({ correct: correctAnswer, reason: lines[i + 1]?.replace("Reason: ", "") });
            }
        }

        const quizId = Date.now().toString();
        quizStore.set(quizId, { questions, answers, summary });

        const questionsText = questions.map(q => `${q.question}\n${q.options.join("\n")}`).join("\n\n");
        return { questions: questionsText, quizId };
    } catch (error) {
        console.error("Quiz Error:", error.response?.data || error.message);
        return { questions: lang === "mr" ? "एपीआय समस्यांमुळे प्रश्नमंजुषा उपलब्ध नाही." : lang === "hi" ? "एपीआई समस्याओं के कारण क्विज उपलब्ध नहीं है।" : "Quiz unavailable due to API issues.", quizId: null };
    }
}

// Generate recommendations based on quiz performance in the requested language
async function generateRecommendations(summary, quizData, userAnswers, lang) {
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    
    const { questions, answers } = quizData;
    let incorrectTopics = [];

    questions.forEach((q, i) => {
        const userAnswer = userAnswers[`Q${i + 1}`]?.toLowerCase();
        const correctAnswer = answers[i].correct.toLowerCase();
        if (userAnswer !== correctAnswer) {
            incorrectTopics.push(q.question);
        }
    });

    try {
        const langInstruction = lang === "mr" ? "मराठीत" : lang === "hi" ? "हिन्दी में" : "in English";
        const prompt = incorrectTopics.length > 0
            ? `Based on this summary: "${summary}" and the following quiz questions answered incorrectly: "${incorrectTopics.join("; ")}", suggest 3 specific topics a user should study to improve their understanding of agri-tech related to this content. Provide each topic as a short sentence ${langInstruction}. Format as:
               - [Topic 1]
               - [Topic 2]
               - [Topic 3]`
            : `Based on this summary: "${summary}", suggest 3 general topics a user should study to deepen their understanding of agri-tech related to this content, as they answered all quiz questions correctly. Provide each topic as a short sentence ${langInstruction}. Format as:
               - [Topic 1]
               - [Topic 2]
               - [Topic 3]`;

        const response = await axios.post(geminiApiUrl, {
            contents: [{ parts: [{ text: prompt }] }]
        }, { headers: { "Content-Type": "application/json" } });

        const recommendations = response.data.candidates[0].content.parts[0].text;
        console.log("Generated Recommendations:", recommendations);
        return recommendations;
    } catch (error) {
        console.error("Recommendation Error:", error.response?.data || error.message);
        return lang === "mr" 
            ? `- मूलभूत कृषी-तंत्रज्ञान संकल्पनांचा आढावा घ्या.\n- पीक-विशिष्ट शेती तंत्रांचा अभ्यास करा.\n- आधुनिक कृषी साधनांबद्दल जाणून घ्या.` 
            : lang === "hi" 
            ? `- मूल कृषि-प्रौद्योगिकी अवधारणाओं की समीक्षा करें।\n- फसल-विशिष्ट खेती तकनीकों का अध्ययन करें।\n- आधुनिक कृषि उपकरणों के बारे में जानें।` 
            : `- Review basic agri-tech concepts.\n- Study crop-specific farming techniques.\n- Learn about modern agricultural tools.`;
    }
}

// Submit quiz endpoint
app.post("/submit-quiz", async (req, res) => {
    const { quizId, userAnswers, lang } = req.body;
    if (!quizId || !userAnswers || !lang) return res.status(400).json({ error: "Quiz ID, answers, and language are required" });

    const quizData = quizStore.get(quizId);
    if (!quizData) return res.status(404).json({ error: "Quiz not found" });

    const { questions, answers, summary } = quizData;
    let score = 0;
    const totalQuestions = questions.length;

    console.log("User Answers:", userAnswers);
    console.log("Stored Answers:", answers);

    const langLabels = {
        en: { yourAnswer: "Your Answer", correctAnswer: "Correct Answer", reason: "Reason", result: "Result", correct: "Correct", incorrect: "Incorrect", notAnswered: "Not answered" },
        mr: { yourAnswer: "आपले उत्तर", correctAnswer: "बरोबर उत्तर", reason: "कारण", result: "निकाल", correct: "बरोबर", incorrect: "चुकीचे", notAnswered: "उत्तर दिले नाही" },
        hi: { yourAnswer: "आपका उत्तर", correctAnswer: "सही उत्तर", reason: "कारण", result: "परिणाम", correct: "सही", incorrect: "गलत", notAnswered: "उत्तर नहीं दिया" }
    };

    const labels = langLabels[lang] || langLabels.en;

    const results = questions.map((q, i) => {
        const userAnswer = userAnswers[`Q${i + 1}`]?.toLowerCase();
        const correctAnswer = answers[i].correct.toLowerCase();
        const reason = answers[i].reason;
        const isCorrect = userAnswer === correctAnswer;
        if (isCorrect) score += 1;
        console.log(`Q${i + 1}: User Answer = "${userAnswer}", Correct Answer = "${correctAnswer}", Is Correct = ${isCorrect}`);
        return `${q.question}\n${q.options.join("\n")}\n${labels.yourAnswer}: ${userAnswer || labels.notAnswered}\n${labels.correctAnswer}: ${correctAnswer}\n${labels.reason}: ${reason}\n${labels.result}: ${isCorrect ? labels.correct : labels.incorrect}`;
    }).join("\n\n");

    const percentage = (score / totalQuestions) * 100;
    const recommendations = await generateRecommendations(summary, quizData, userAnswers, lang);

    quizStore.delete(quizId);
    res.json({
        results,
        score: `${score}/${totalQuestions}`,
        percentage: percentage.toFixed(2),
        recommendations
    });
});

// Main API route
app.get("/video", async (req, res) => {
    const { crop, videoType, lang } = req.query;
    if (!crop) return res.status(400).json({ error: "Crop is required" });
    if (!videoType || !["normal", "animated"].includes(videoType)) {
        return res.status(400).json({ error: "Invalid video type. Use 'normal' or 'animated'." });
    }
    if (!lang || !["en", "mr", "hi"].includes(lang)) {
        return res.status(400).json({ error: "Invalid language. Use 'en', 'mr', or 'hi'." });
    }

    try {
        const videoData = await fetchYouTubeVideo(crop, videoType);
        const summary = await generateSummary(videoData, crop, lang);
        const { questions, quizId } = await generateQuiz(summary, lang);
        res.json({ ...videoData, summary, quiz: questions, quizId });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});