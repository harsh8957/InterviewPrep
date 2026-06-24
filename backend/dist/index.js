// src/index.ts
import "dotenv/config";
import express4 from "express";
import cors from "cors";

// src/lib/db.ts
import mongoose from "mongoose";
var MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env file");
  process.exit(1);
}
var connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// src/server/routes/auth.ts
import express from "express";
import jwt2 from "jsonwebtoken";

// src/lib/models/User.ts
import mongoose2 from "mongoose";
import bcrypt from "bcryptjs";
var userSchema = new mongoose2.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["candidate", "hr"],
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: function() {
      return this.role === "hr";
    }
  },
  position: {
    type: String,
    required: function() {
      return this.role === "hr";
    }
  }
}, {
  timestamps: true
});
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
var User = mongoose2.model("User", userSchema);
var User_default = User;

// src/server/middleware/auth.ts
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
var authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
var requireHR = (req, res, next) => {
  if (!req.user || req.user.role !== "hr") {
    return res.status(403).json({ message: "HR access required" });
  }
  next();
};

// src/server/routes/auth.ts
var router = express.Router();
var JWT_SECRET2 = process.env.JWT_SECRET || "your-secret-key";
router.post("/signup", async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      company,
      position
    } = req.body;
    const existingUser = await User_default.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = new User_default({
      email,
      password,
      firstName,
      lastName,
      role,
      ...role === "hr" && { company, position }
    });
    await user.save();
    const token = jwt2.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET2,
      { expiresIn: "24h" }
    );
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company,
        position: user.position
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Error creating user" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User_default.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt2.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET2,
      { expiresIn: "24h" }
    );
    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company,
        position: user.position
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error during login" });
  }
});
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User_default.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Error fetching user data" });
  }
});
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});
var auth_default = router;

// src/server/routes/interviews.ts
import express2 from "express";
import mongoose4 from "mongoose";
import axios from "axios";

// src/lib/models/InterviewRoom.ts
import mongoose3 from "mongoose";
var interviewRoomSchema = new mongoose3.Schema({
  title: {
    type: String,
    required: true
  },
  hr: {
    type: mongoose3.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  candidate: {
    type: mongoose3.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  scheduledFor: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    default: 60
    // Default 60 minutes (1 hour)
  },
  jobRole: {
    type: String,
    required: true,
    enum: ["web-developer", "app-developer", "ml-ai", "ux-designer", "data-scientist"],
    default: "web-developer"
  },
  experienceLevel: {
    type: String,
    required: true,
    enum: ["fresher", "junior", "mid-level", "senior"],
    default: "mid-level"
  },
  roomLink: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled"
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});
var InterviewRoom = mongoose3.model("InterviewRoom", interviewRoomSchema);
var InterviewRoom_default = InterviewRoom;

// src/server/routes/interviews.ts
import { v4 as uuidv4 } from "uuid";
var router2 = express2.Router();
router2.get("/", authenticateToken, requireHR, async (req, res) => {
  try {
    const interviews = await InterviewRoom_default.find({ hr: req.user?.userId }).populate("candidate", "firstName lastName email").sort({ scheduledFor: 1 });
    res.json(interviews);
  } catch (error) {
    console.error("Error fetching interviews:", error);
    res.status(500).json({ message: "Error fetching interviews" });
  }
});
router2.get("/candidate", authenticateToken, async (req, res) => {
  try {
    const interviews = await InterviewRoom_default.find({ candidate: req.user?.userId }).populate("hr", "firstName lastName email company").sort({ scheduledFor: -1 });
    res.json(interviews);
  } catch (error) {
    console.error("Error fetching candidate interviews:", error);
    res.status(500).json({ message: "Error fetching interviews" });
  }
});
router2.post("/", authenticateToken, requireHR, async (req, res) => {
  try {
    const {
      title,
      candidateEmail,
      scheduledFor,
      duration = 60,
      jobRole = "web-developer",
      experienceLevel = "mid-level"
    } = req.body;
    const candidate = await User_default.findOne({ email: candidateEmail, role: "candidate" });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }
    const roomId = uuidv4();
    const roomLink = `/interview-room/${roomId}`;
    const interview = new InterviewRoom_default({
      title,
      hr: req.user?.userId,
      candidate: candidate._id,
      scheduledFor,
      duration,
      jobRole,
      experienceLevel,
      roomLink,
      status: "scheduled"
    });
    await interview.save();
    await interview.populate("candidate", "firstName lastName email");
    res.status(201).json(interview);
  } catch (error) {
    console.error("Error creating interview:", error);
    res.status(500).json({ message: "Error creating interview" });
  }
});
router2.put("/:id/cancel", authenticateToken, requireHR, async (req, res) => {
  try {
    const interview = await InterviewRoom_default.findOne({
      _id: req.params.id,
      hr: req.user?.userId
    });
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }
    if (interview.status !== "scheduled") {
      return res.status(400).json({ message: "Interview cannot be cancelled" });
    }
    interview.status = "cancelled";
    await interview.save();
    res.json(interview);
  } catch (error) {
    console.error("Error cancelling interview:", error);
    res.status(500).json({ message: "Error cancelling interview" });
  }
});
router2.get("/:id", authenticateToken, async (req, res) => {
  try {
    const interview = await InterviewRoom_default.findById(req.params.id).populate("hr", "firstName lastName email company").populate("candidate", "firstName lastName email");
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }
    if (req.user?.userId !== interview.hr._id.toString() && req.user?.userId !== interview.candidate._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(interview);
  } catch (error) {
    console.error("Error fetching interview:", error);
    res.status(500).json({ message: "Error fetching interview details" });
  }
});
router2.put("/:id/complete", authenticateToken, async (req, res) => {
  try {
    const interview = await InterviewRoom_default.findOne({
      _id: req.params.id,
      $or: [
        { hr: req.user?.userId },
        { candidate: req.user?.userId }
      ]
    });
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }
    if (interview.status !== "scheduled") {
      return res.status(400).json({ message: "Interview cannot be completed" });
    }
    interview.status = "completed";
    await interview.save();
    res.json(interview);
  } catch (error) {
    console.error("Error completing interview:", error);
    res.status(500).json({ message: "Error completing interview" });
  }
});
router2.put("/:id/auto-complete", async (req, res) => {
  try {
    const interview = await InterviewRoom_default.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }
    if (interview.status !== "scheduled") {
      return res.status(400).json({ message: "Interview is already completed or cancelled" });
    }
    const now = /* @__PURE__ */ new Date();
    const scheduledTime = new Date(interview.scheduledFor);
    const endTime = new Date(scheduledTime.getTime() + interview.duration * 6e4);
    if (now > endTime) {
      interview.status = "completed";
      await interview.save();
      return res.json({ message: "Interview automatically completed", interview });
    }
    return res.status(400).json({ message: "Interview time has not ended yet" });
  } catch (error) {
    console.error("Error auto-completing interview:", error);
    res.status(500).json({ message: "Error auto-completing interview" });
  }
});
router2.put("/auto-complete/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    let interview;
    if (mongoose4.Types.ObjectId.isValid(idParam)) {
      interview = await InterviewRoom_default.findById(idParam);
    }
    if (!interview) {
      console.log(`[Auto-Complete] Could not find by _id ${idParam}, trying by roomLink UUID part.`);
      const roomLinkToFind = `/interview-room/${idParam}`;
      interview = await InterviewRoom_default.findOne({ roomLink: roomLinkToFind });
    }
    if (!interview) {
      console.log(`[Auto-Complete] Interview not found by _id or roomLink for param: ${idParam}`);
      return res.status(404).json({ message: "Interview not found" });
    }
    console.log(`[Auto-Complete] Found interview ${interview._id} with status ${interview.status}`);
    if (interview.status !== "scheduled") {
      return res.status(400).json({ message: `Interview is already ${interview.status}` });
    }
    interview.status = "completed";
    await interview.save();
    console.log(`[Auto-Complete] Marked interview ${interview._id} as completed.`);
    return res.json({ message: "Interview automatically completed", interview });
  } catch (error) {
    console.error("Error auto-completing interview:", error);
    res.status(500).json({ message: "Error auto-completing interview" });
  }
});
router2.get("/room/:roomId", async (req, res) => {
  try {
    const roomLink = `/interview-room/${req.params.roomId}`;
    const interview = await InterviewRoom_default.findOne({ roomLink }).populate("hr", "firstName lastName email company").populate("candidate", "firstName lastName email");
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }
    res.json(interview);
  } catch (error) {
    console.error("Error fetching interview by room ID:", error);
    res.status(500).json({ message: "Error fetching interview details" });
  }
});
router2.put("/room/:roomId/complete", async (req, res) => {
  try {
    console.log(`Attempting to complete interview with room ID: ${req.params.roomId}`);
    const roomLink = `/interview-room/${req.params.roomId}`;
    console.log(`Looking for interview with roomLink: ${roomLink}`);
    const interview = await InterviewRoom_default.findOne({ roomLink });
    if (!interview) {
      console.log(`No interview found with roomLink: ${roomLink}`);
      try {
        console.log(`Trying direct ID lookup for: ${req.params.roomId}`);
        const interviewById = await InterviewRoom_default.findById(req.params.roomId);
        if (!interviewById) {
          console.log(`No interview found by direct ID either: ${req.params.roomId}`);
          return res.status(404).json({ message: "Interview not found" });
        }
        if (interviewById.status !== "scheduled") {
          console.log(`Interview found by ID but status is: ${interviewById.status}`);
          return res.status(400).json({ message: "Interview is already completed or cancelled" });
        }
        console.log(`Updating interview status to completed for ID: ${interviewById._id}`);
        interviewById.status = "completed";
        await interviewById.save();
        return res.json({
          message: "Interview marked as completed via direct ID",
          interview: interviewById
        });
      } catch (idError) {
        console.error("Error in direct ID lookup:", idError);
        return res.status(404).json({ message: "Interview not found by room ID or direct ID" });
      }
    }
    if (interview.status !== "scheduled") {
      console.log(`Interview found but status is: ${interview.status}`);
      return res.status(400).json({ message: "Interview is already completed or cancelled" });
    }
    console.log(`Updating interview status to completed for ID: ${interview._id}`);
    interview.status = "completed";
    await interview.save();
    return res.json({
      message: "Interview marked as completed",
      interview
    });
  } catch (error) {
    console.error("Error completing interview by room ID:", error);
    res.status(500).json({ message: "Error completing interview" });
  }
});
router2.post("/gemini/questions", async (req, res) => {
  try {
    const { jobRole, experienceLevel, count = 4 } = req.body;
    if (!jobRole) {
      return res.status(400).json({ message: "Job role is required" });
    }
    const evaluatorServiceUrl = process.env.EVALUATOR_SERVICE_URL || "http://localhost:8001";
    try {
      const response = await axios.post(`${evaluatorServiceUrl}/fetch-questions`, {
        role: jobRole,
        // Python service expects 'role'
        num_questions: count
      });
      if (response.data && Array.isArray(response.data)) {
        const questions = response.data.map((q) => q.text);
        res.json({ questions });
      } else {
        console.error("Unexpected response format from evaluator service:", response.data);
        res.status(500).json({ message: "Error fetching questions: Unexpected response from evaluator service" });
      }
    } catch (apiError) {
      console.error("Error calling evaluator service for questions:", apiError.message);
      if (apiError.response) {
        console.error("Evaluator service response error:", apiError.response.data);
        return res.status(apiError.response.status || 500).json({
          message: apiError.response.data?.detail || "Error fetching questions from evaluator service"
        });
      }
      res.status(500).json({ message: "Error fetching questions from evaluator service" });
    }
  } catch (error) {
    console.error("Error generating questions with Gemini:", error);
    res.status(500).json({ message: "Error generating interview questions" });
  }
});
router2.post("/gemini/analyze", async (req, res) => {
  try {
    const { question, answer, jobRole, experienceLevel } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ message: "Question and answer are required" });
    }
    const evaluatorServiceUrl = process.env.EVALUATOR_SERVICE_URL || "http://localhost:8001";
    try {
      const response = await axios.post(`${evaluatorServiceUrl}/evaluate-answer`, {
        question,
        answer,
        role: jobRole
        // Pass jobRole as role to the evaluator service
        // experienceLevel is not explicitly used by the python service's evaluate-answer endpoint currently
      });
      if (response.data && typeof response.data.score === "number" && typeof response.data.feedback === "string") {
        const analysis = {
          score: Math.round(response.data.score * 100),
          // Convert 0.0-1.0 to 0-100
          feedback: response.data.feedback
          // strengths and weaknesses are not provided by the current python service
          // If needed, the python service prompt and parsing would need to be updated.
        };
        res.json(analysis);
      } else {
        console.error("Unexpected response format from evaluator service for analysis:", response.data);
        res.status(500).json({ message: "Error analyzing answer: Unexpected response from evaluator service" });
      }
    } catch (apiError) {
      console.error("Error calling evaluator service for analysis:", apiError.message);
      if (apiError.response) {
        console.error("Evaluator service analysis response error:", apiError.response.data);
        return res.status(apiError.response.status || 500).json({
          message: apiError.response.data?.detail || "Error analyzing answer from evaluator service"
        });
      }
      res.status(500).json({ message: "Error analyzing answer from evaluator service" });
    }
  } catch (error) {
    console.error("Error analyzing answer with Gemini:", error);
    res.status(500).json({ message: "Error analyzing interview answer" });
  }
});
router2.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }
    res.json({ success: true, message: "TTS request received" });
  } catch (error) {
    console.error("Error with TTS request:", error);
    res.status(500).json({ message: "Error with text-to-speech request" });
  }
});
var interviews_default = router2;

// src/server/routes/interviewResults.ts
import express3 from "express";

// src/lib/models/InterviewResult.ts
import mongoose5 from "mongoose";
var interviewResultSchema = new mongoose5.Schema({
  candidateId: {
    type: mongoose5.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  interviewId: {
    type: mongoose5.Schema.Types.ObjectId,
    ref: "InterviewRoom"
  },
  jobRole: {
    type: String,
    required: true
  },
  experienceLevel: {
    type: String,
    required: true
  },
  totalScore: {
    type: Number,
    required: true
  },
  feedback: {
    type: String,
    required: true
  },
  strengths: [{
    type: String
  }],
  improvements: [{
    type: String
  }],
  date: {
    type: Date,
    default: Date.now
  },
  answers: [{
    questionId: String,
    questionText: String,
    answerText: String,
    score: Number,
    feedback: String,
    strengths: [String],
    weaknesses: [String]
  }]
}, {
  timestamps: true
});
var InterviewResult = mongoose5.model("InterviewResult", interviewResultSchema);
var InterviewResult_default = InterviewResult;

// src/server/routes/interviewResults.ts
var router3 = express3.Router();
router3.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    let results;
    if (userRole === "hr") {
      const interviews = await InterviewRoom_default.find({ hr: userId });
      const interviewIds = interviews.map((interview) => interview._id);
      results = await InterviewResult_default.find({
        interviewId: { $in: interviewIds }
      }).sort({ createdAt: -1 });
    } else {
      results = await InterviewResult_default.find({
        candidateId: userId
      }).sort({ createdAt: -1 });
    }
    res.json(results);
  } catch (error) {
    console.error("Error fetching interview results:", error);
    res.status(500).json({ message: "Error fetching interview results" });
  }
});
router3.get("/interview/:interviewId", authenticateToken, async (req, res) => {
  try {
    console.log(`Fetching results for interview ID: ${req.params.interviewId}`);
    const interviewId = req.params.interviewId;
    const interview = await InterviewRoom_default.findById(interviewId);
    if (!interview) {
      console.log(`Interview not found with ID: ${interviewId}`);
      return res.status(404).json({ message: "Interview not found" });
    }
    console.log(`Interview found, checking permissions. Status: ${interview.status}`);
    if (req.user?.role === "hr" && interview.hr.toString() !== req.user.userId) {
      console.log("Access denied: HR does not match");
      return res.status(403).json({ message: "Access denied" });
    }
    if (req.user?.role === "candidate" && interview.candidate.toString() !== req.user.userId) {
      console.log("Access denied: Candidate does not match");
      return res.status(403).json({ message: "Access denied" });
    }
    console.log(`Searching for results with interviewId: ${interviewId}`);
    const results = await InterviewResult_default.find({ interviewId }).sort({ createdAt: -1 });
    if (results.length === 0) {
      console.log(`No results found for interview ID: ${interviewId}`);
      if (interview.status === "completed") {
        return res.status(404).json({
          message: "Interview is marked as completed, but no results are available yet",
          interviewStatus: interview.status
        });
      } else {
        return res.status(404).json({
          message: "No results available for this interview yet",
          interviewStatus: interview.status
        });
      }
    }
    console.log(`Found ${results.length} results, returning the most recent one`);
    res.json(results[0]);
  } catch (error) {
    console.error("Error fetching interview results:", error);
    res.status(500).json({ message: "Error fetching interview results" });
  }
});
router3.get("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await InterviewResult_default.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Interview result not found" });
    }
    if (req.user?.role === "candidate" && result.candidateId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (req.user?.role === "hr") {
      const interview = await InterviewRoom_default.findById(result.interviewId);
      if (!interview || interview.hr.toString() !== req.user.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    res.json(result);
  } catch (error) {
    console.error("Error fetching interview result:", error);
    res.status(500).json({ message: "Error fetching interview result" });
  }
});
router3.post("/", authenticateToken, async (req, res) => {
  try {
    console.log("Creating new interview result");
    const {
      interviewId,
      jobRole,
      experienceLevel,
      totalScore,
      feedback,
      strengths,
      improvements,
      answers
    } = req.body;
    let interviewDocument = null;
    let actualInterviewObjectId = void 0;
    if (interviewId) {
      console.log(`Attempting to find interview room using UUID part: ${interviewId}`);
      const linkToFind = `/interview-room/${interviewId}`;
      interviewDocument = await InterviewRoom_default.findOne({ roomLink: linkToFind });
      if (!interviewDocument) {
        console.log(`InterviewRoom not found with roomLink containing UUID: ${interviewId}`);
        return res.status(404).json({ message: `InterviewRoom associated with ID ${interviewId} not found via roomLink.` });
      }
      actualInterviewObjectId = interviewDocument._id;
      console.log(`Found InterviewRoom with _id: ${actualInterviewObjectId} for UUID part: ${interviewId}`);
      if (interviewDocument.status === "scheduled") {
        console.log(`Marking interview ${actualInterviewObjectId} as completed`);
        interviewDocument.status = "completed";
        await interviewDocument.save();
        console.log("Interview status updated to 'completed'");
      } else {
        console.log(`Interview ${actualInterviewObjectId} already has status: ${interviewDocument.status}`);
      }
    } else {
      console.log("No interview ID (UUID part) provided with results. Saving result without linking to a specific InterviewRoom.");
    }
    if (actualInterviewObjectId) {
      const existingResults = await InterviewResult_default.find({ interviewId: actualInterviewObjectId });
      if (existingResults.length > 0) {
        console.log(`Found ${existingResults.length} existing results for interview _id ${actualInterviewObjectId}. Will create a new version.`);
      }
    }
    const result = new InterviewResult_default({
      candidateId: req.user?.userId,
      interviewId: actualInterviewObjectId,
      // Use the actual ObjectId here
      jobRole,
      experienceLevel,
      totalScore,
      feedback,
      strengths,
      improvements,
      answers,
      date: /* @__PURE__ */ new Date()
    });
    console.log("Saving new interview result");
    await result.save();
    console.log(`Result saved with ID: ${result._id}`);
    if (interviewDocument) {
      try {
        console.log(`Adding result reference to interview ${interviewDocument._id}`);
        const newNote = `Result ID: ${result._id} - Score: ${totalScore}/100`;
        if (typeof interviewDocument.notes === "string" && interviewDocument.notes.length > 0) {
          interviewDocument.notes += `
${newNote}`;
        } else {
          interviewDocument.notes = newNote;
        }
        await interviewDocument.save();
        console.log("Updated interview with result reference");
      } catch (updateError) {
        console.error("Error updating interview with result reference:", updateError);
      }
    }
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating interview result:", error);
    res.status(500).json({ message: "Error creating interview result" });
  }
});
var interviewResults_default = router3;

// src/index.ts
var app = express4();
var PORT = process.env.PORT || 5e3;
connectDB();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express4.json());
app.use("/api/auth", auth_default);
app.use("/api/interviews", interviews_default);
app.use("/api/interview-results", interviewResults_default);
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
