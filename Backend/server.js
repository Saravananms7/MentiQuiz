const express = require("express");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server: SocketIOServer } = require("socket.io");

dotenv.config();

const app = express();  
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store active quiz sessions
const activeQuizzes = new Map();
const participantCounts = new Map();

io.on("connection", (socket) => {
  console.log("Socket.IO client connected", socket.id);

  // Join quiz room
  socket.on("join-quiz", async (data) => {
    const { quizCode, userId, userName } = data;
    const roomName = `quiz-${quizCode}`;
    
    try {
      // Verify quiz exists
      const quiz = await prisma.quiz.findUnique({
        where: { code: quizCode }
      });

      if (!quiz) {
        socket.emit("error", { message: "Quiz not found" });
        return;
      }

      // Join room
      socket.join(roomName);
      socket.quizCode = quizCode;
      socket.userId = userId;
      socket.userName = userName;

      // Update participant count
      const currentCount = participantCounts.get(quizCode) || 0;
      participantCounts.set(quizCode, currentCount + 1);

      // Notify all participants about new join
      io.to(roomName).emit("participant-joined", {
        userId,
        userName,
        totalParticipants: participantCounts.get(quizCode)
      });

      // Send current quiz status to new participant
      socket.emit("quiz-status", {
        isActive: quiz.isActive,
        currentQuestionId: quiz.currentQuestionId,
        totalParticipants: participantCounts.get(quizCode)
      });

      console.log(`User ${userName} joined quiz ${quizCode}`);
    } catch (error) {
      console.error("Join quiz error:", error);
      socket.emit("error", { message: "Failed to join quiz" });
    }
  });

  // Leave quiz room
  socket.on("leave-quiz", (data) => {
    const { quizCode } = data;
    const roomName = `quiz-${quizCode}`;
    
    socket.leave(roomName);
    
    // Update participant count
    const currentCount = participantCounts.get(quizCode) || 0;
    if (currentCount > 0) {
      participantCounts.set(quizCode, currentCount - 1);
    }

    // Notify remaining participants
    io.to(roomName).emit("participant-left", {
      userId: socket.userId,
      userName: socket.userName,
      totalParticipants: participantCounts.get(quizCode) || 0
    });

    console.log(`User ${socket.userName} left quiz ${quizCode}`);
  });

  // Submit answer in real-time
  socket.on("submit-answer", async (data) => {
    const { quizCode, questionId, optionId } = data;
    const roomName = `quiz-${quizCode}`;
    
    try {
      // Save response to database
      const response = await prisma.response.create({
        data: {
          userId: socket.userId,
          quizId: (await prisma.quiz.findUnique({ where: { code: quizCode } })).id,
          questionId: parseInt(questionId),
          optionId: parseInt(optionId)
        }
      });

      // Get real-time statistics
      const question = await prisma.question.findUnique({
        where: { id: parseInt(questionId) },
        include: { options: true }
      });

      const responses = await prisma.response.findMany({
        where: { questionId: parseInt(questionId) },
        include: { option: true }
      });

      // Calculate option counts
      const optionCounts = {};
      question.options.forEach(option => {
        optionCounts[option.id] = responses.filter(r => r.optionId === option.id).length;
      });

      // Broadcast real-time results
      io.to(roomName).emit("answer-submitted", {
        questionId,
        optionCounts,
        totalResponses: responses.length,
        submittedBy: socket.userName
      });

    } catch (error) {
      console.error("Submit answer error:", error);
      socket.emit("error", { message: "Failed to submit answer" });
    }
  });

  // Admin controls
  socket.on("start-quiz", async (data) => {
    const { quizCode } = data;
    const roomName = `quiz-${quizCode}`;
    
    try {
      await prisma.quiz.update({
        where: { code: quizCode },
        data: { isActive: true }
      });

      io.to(roomName).emit("quiz-started", { quizCode });
      console.log(`Quiz ${quizCode} started`);
    } catch (error) {
      console.error("Start quiz error:", error);
      socket.emit("error", { message: "Failed to start quiz" });
    }
  });

  socket.on("next-question", async (data) => {
    const { quizCode, questionId } = data;
    const roomName = `quiz-${quizCode}`;
    
    try {
      await prisma.quiz.update({
        where: { code: quizCode },
        data: { currentQuestionId: parseInt(questionId) }
      });

      const question = await prisma.question.findUnique({
        where: { id: parseInt(questionId) },
        include: { options: true }
      });

      io.to(roomName).emit("next-question", {
        questionId,
        question: {
          id: question.id,
          text: question.text,
          options: question.options.map(opt => ({
            id: opt.id,
            text: opt.text
          }))
        }
      });

      console.log(`Next question ${questionId} shown for quiz ${quizCode}`);
    } catch (error) {
      console.error("Next question error:", error);
      socket.emit("error", { message: "Failed to show next question" });
    }
  });

  socket.on("end-quiz", async (data) => {
    const { quizCode } = data;
    const roomName = `quiz-${quizCode}`;
    
    try {
      await prisma.quiz.update({
        where: { code: quizCode },
        data: { isActive: false, currentQuestionId: null }
      });

      // Calculate final leaderboard
      const quiz = await prisma.quiz.findUnique({
        where: { code: quizCode },
        include: {
          responses: {
            include: { user: true, option: true }
          }
        }
      });

      const scoreMap = {};
      for (const response of quiz.responses) {
        const { userId, user, option } = response;
        if (!scoreMap[userId]) {
          scoreMap[userId] = {
            name: user.name,
            score: 0,
            totalQuestions: 0
          };
        }
        scoreMap[userId].totalQuestions += 1;
        if (option.isCorrect) {
          scoreMap[userId].score += 1;
        }
      }

      const leaderboard = Object.entries(scoreMap)
        .map(([userId, data]) => ({ userId: parseInt(userId), ...data }))
        .sort((a, b) => b.score - a.score);

      io.to(roomName).emit("quiz-ended", {
        finalScores: leaderboard,
        totalParticipants: participantCounts.get(quizCode) || 0
      });

      // Clean up
      participantCounts.delete(quizCode);
      activeQuizzes.delete(quizCode);

      console.log(`Quiz ${quizCode} ended`);
    } catch (error) {
      console.error("End quiz error:", error);
      socket.emit("error", { message: "Failed to end quiz" });
    }
  });

  socket.on("disconnect", () => {
    if (socket.quizCode) {
      const roomName = `quiz-${socket.quizCode}`;
      const currentCount = participantCounts.get(socket.quizCode) || 0;
      if (currentCount > 0) {
        participantCounts.set(socket.quizCode, currentCount - 1);
      }

      io.to(roomName).emit("participant-left", {
        userId: socket.userId,
        userName: socket.userName,
        totalParticipants: participantCounts.get(socket.quizCode) || 0
      });
    }
    console.log("Socket.IO client disconnected", socket.id);
  });
});

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 6700;


app.post("/auth/register", async (req, res) => {
  const { name, username, password, role } = req.body;

  try {
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    const isAdmin = role?.toLowerCase() === "admin";

    const newUser = await prisma.user.create({
      data: { username, name, password, isAdmin },
    });

    return res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Signup failed" });
  }
});





app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (!existing) {
      return res.status(404).json({ error: "User does not exist" });
    }

    if (existing.password !== password) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      {
        userId: existing.id,
        isAdmin: existing.isAdmin,
      },
      process.env.JWT_SECRET || "jwtpass",
      { expiresIn: "1h" }
    );

    return res.json({
      token,
      message: "Login successful",
      role: existing.isAdmin ? "admin" : "user"
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});






const middleware = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.token;

  if (!authHeader) {
    return res.status(401).json({ error: "No token found" });
  }

  // Extract token from "Bearer <token>" format
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "jwtpass");
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}




const adminOnly = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};



app.get("/profile", middleware, async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User does not exist" });
    }

    return res.status(200).json({
      id: `user_${user.id}`,
      name: user.name,
      username: user.username,
      role: user.isAdmin ? "ADMIN" : "USER",
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    return res.status(500).json({ error: "Couldn't retrieve user profile" });
  }
});





const shortid = require("shortid");

app.post("/quiz", middleware, adminOnly, async (req, res) => {
    const { title, questions, isPoll } = req.body;
    const userId = req.user.userId;

    if (!title || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: "Title and questions are required" });
    }

    try {
        const quizCode = shortid.generate().slice(0, 6).toUpperCase(); // Optional: uppercase for consistency

        const newQuiz = await prisma.quiz.create({
            data: {
                title,
                code: quizCode,           
                isPoll: !!isPoll,
                isActive: false,
                currentQuestionId: null,
                createdById: userId,
                questions: {
                    create: questions.map((q) => ({
                        text: q.title,
                        options: {
                            create: [
                                { text: q.option1, isCorrect: q.answer === q.option1 },
                                { text: q.option2, isCorrect: q.answer === q.option2 },
                                { text: q.option3, isCorrect: q.answer === q.option3 },
                                { text: q.option4, isCorrect: q.answer === q.option4 }
                            ]
                        }
                    }))
                }
            }
        });

        return res.status(200).json({
            quizId: `quiz_${newQuiz.id}`,
            code: newQuiz.code,
            message: "Quiz created successfully"
        });

    } catch (err) {
        console.error("Quiz creation failed:", err);
        return res.status(500).json({
            error: "Quiz creation failed",
            detail: err.message
        });
    }
});





app.get("/admin/quiz/:code/questions", middleware, adminOnly, async (req, res) => {
  const quizCode = req.params.code;

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { code: quizCode },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });

    if (!quiz) {
      return res.json({ error: "Quiz not found" });
    }

    return res.json({
      questions: quiz.questions
    });
  } catch (err) {
    console.error(err);
    return res.json({ error: "Failed to fetch questions" });
  }
});




app.get("/admin/viewquiz", middleware, adminOnly, async (req, res) => {
    const userId = req.user.userId;

    try {
        const quizzes = await prisma.quiz.findMany({
            where: { createdById: userId },
            include: {
                questions: {
                    include: { options: true }
                }
            }
        });

        if (!quizzes || quizzes.length === 0) {
            return res.json({ error: "No quizzes found" });
        }

        return res.json({ quizzes });
    } catch (err) {
        console.error(err);
        return res.json({ error: "Couldn't retrieve quizzes" });
    }
});



app.get("/quiz/:code", middleware, async (req, res) => {
    const { code } = req.params;

    try {
        const quiz = await prisma.quiz.findUnique({
            where: { code: code },
            include: {
                questions: {
                    include: { options: true }
                }
            }
        });

        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        const formattedQuiz = {
            id: `quiz_${quiz.id}`,
            title: quiz.title,
            questions: quiz.questions.map((q) => {
                const options = q.options;

                return {
                    id: `q${q.id}`,
                    title: q.text,
                    option1: options[0]?.text || "",
                    option2: options[1]?.text || "",
                    option3: options[2]?.text || "",
                    option4: options[3]?.text || "",
                };
            })
        };

        return res.status(200).json(formattedQuiz);
    } catch (err) {
        console.error("Error in GET /quiz/:code:", err);
        return res.status(500).json({ error: "Failed to fetch quiz" });
    }
});





app.post("/quiz/:code/submit", middleware, async (req, res) => {
  const userId = req.user.userId;
  const { code } = req.params;
  const { answers } = req.body;

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { code },
      include: { questions: true }
    });

    if (!quiz) {
      return res.status(404).json({ error: "Cannot find quiz" });
    }

    const quizId = quiz.id;
    const questionIds = quiz.questions.map(q => q.id);

    for (let answer of answers) {
      const questionIdNum = Number(answer.questionId);
      const optionIdNum = Number(answer.selectedOption);

      if (!questionIds.includes(questionIdNum)) {
        return res.status(400).json({ error: `Invalid question ID: ${answer.questionId}` });
      }

      if (isNaN(optionIdNum)) {
        return res.status(400).json({ error: `Invalid option ID: ${answer.selectedOption}` });
      }
    }

    await prisma.response.deleteMany({
      where: {
        userId,
        quizId
      }
    });

    let score = 0;

    await Promise.all(
      answers.map(async (a) => {
        const questionIdNum = Number(a.questionId);
        const optionIdNum = Number(a.selectedOption);

        await prisma.response.create({
          data: {
            userId,
            quizId,
            questionId: questionIdNum,
            optionId: optionIdNum
          }
        });

        const option = await prisma.option.findUnique({
          where: { id: optionIdNum }
        });

        if (option?.isCorrect) {
          score += 1;
        }
      })
    );

    return res.json({
      score,
      total: answers.length,
      message: "Submission evaluated"
    });

  } catch (err) {
    console.error("Submission Error:", err);
    return res.status(500).json({ error: "Submission failed" });
  }
});



app.get("/result/:code", async (req, res) => {
  const { code } = req.params;

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { code },
      include: {
        responses: {
          include: {
            user: true,
            option: true
          }
        }
      }
    });

    if (!quiz || !quiz.responses || quiz.responses.length === 0) {
      return res.json({ message: "No responses yet" });
    }

    const scoreMap = {};

    for (const response of quiz.responses) {
      const { userId, user, option } = response;

      if (!scoreMap[userId]) {
        scoreMap[userId] = {
          name: user.name,
          score: 0,
          totalQuestions: 0
        };
      }

      scoreMap[userId].totalQuestions += 1;

      if (option.isCorrect) {
        scoreMap[userId].score += 1;
      }
    }

    const leaderboard = Object.entries(scoreMap)
      .map(([userId, data]) => ({
        userId: parseInt(userId),
        ...data
      }))
      .sort((a, b) => b.score - a.score);

    return res.json({ leaderboard });
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});




app.get("/health", (req, res) => {
    return res.json({
        message: "Backend running"
    })
})

// Alias for quiz creation for admin
app.post("/admin/quiz", middleware, adminOnly, async (req, res) => {
  // Reuse the /quiz logic
  const { title, questions, isPoll } = req.body;
  const userId = req.user.userId;
  if (!title || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: "Title and questions are required" });
  }
  try {
    const shortid = require("shortid");
    const quizCode = shortid.generate().slice(0, 6).toUpperCase();
    const newQuiz = await prisma.quiz.create({
      data: {
        title,
        code: quizCode,
        isPoll: !!isPoll,
        isActive: false,
        currentQuestionId: null,
        createdById: userId,
        questions: {
          create: questions.map((q) => ({
            text: q.title,
            options: {
              create: [
                { text: q.option1, isCorrect: q.answer === q.option1 },
                { text: q.option2, isCorrect: q.answer === q.option2 },
                { text: q.option3, isCorrect: q.answer === q.option3 },
                { text: q.option4, isCorrect: q.answer === q.option4 }
              ]
            }
          }))
        }
      }
    });
    return res.status(200).json({
      quizId: `quiz_${newQuiz.id}`,
      code: newQuiz.code,
      message: "Quiz created successfully"
    });
  } catch (err) {
    console.error("Quiz creation failed:", err);
    return res.status(500).json({ error: "Quiz creation failed", detail: err.message });
  }
});

// Add question to existing quiz
app.post("/admin/quiz/:quizId/question", middleware, adminOnly, async (req, res) => {
  const { quizId } = req.params;
  const { title, option1, option2, option3, option4, answer } = req.body;
  if (!title || !option1 || !option2 || !option3 || !option4 || !answer) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    const question = await prisma.question.create({
      data: {
        text: title,
        quizId: Number(quizId),
        options: {
          create: [
            { text: option1, isCorrect: answer === option1 },
            { text: option2, isCorrect: answer === option2 },
            { text: option3, isCorrect: answer === option3 },
            { text: option4, isCorrect: answer === option4 }
          ]
        }
      },
      include: { options: true }
    });
    return res.status(201).json({ question });
  } catch (err) {
    console.error("Add question error:", err);
    return res.status(500).json({ error: "Failed to add question" });
  }
});

// Trigger quiz start via WebSocket
app.post("/admin/quiz/:quizId/start", middleware, adminOnly, async (req, res) => {
  const { quizId } = req.params;
  io.emit("quiz-started", { quizId });
  return res.json({ message: "Quiz start triggered" });
});

// Show next question via WebSocket
app.post("/admin/quiz/:quizId/next", middleware, adminOnly, async (req, res) => {
  const { quizId } = req.params;
  const { questionId, questionData } = req.body;
  io.emit("next-question", { questionId, questionData });
  return res.json({ message: "Next question triggered" });
});

// View all responses for a quiz
app.get("/admin/quiz/:quizId/responses", middleware, adminOnly, async (req, res) => {
  const { quizId } = req.params;
  try {
    const responses = await prisma.response.findMany({
      where: { quizId: Number(quizId) },
      include: {
        user: true,
        question: true,
        option: true
      }
    });
    return res.json({ responses });
  } catch (err) {
    console.error("Fetch responses error:", err);
    return res.status(500).json({ error: "Failed to fetch responses" });
  }
});

// Admin leaderboard alias
app.get("/admin/quiz/:quizId/leaderboard", middleware, adminOnly, async (req, res) => {
  const { quizId } = req.params;
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: Number(quizId) },
      include: {
        responses: {
          include: {
            user: true,
            option: true
          }
        }
      }
    });
    if (!quiz || !quiz.responses || quiz.responses.length === 0) {
      return res.json({ message: "No responses yet" });
    }
    const scoreMap = {};
    for (const response of quiz.responses) {
      const { userId, user, option } = response;
      if (!scoreMap[userId]) {
        scoreMap[userId] = {
          name: user.name,
          score: 0,
          totalQuestions: 0
        };
      }
      scoreMap[userId].totalQuestions += 1;
      if (option.isCorrect) {
        scoreMap[userId].score += 1;
      }
    }
    const leaderboard = Object.entries(scoreMap)
      .map(([userId, data]) => ({ userId: parseInt(userId), ...data }))
      .sort((a, b) => b.score - a.score);
    return res.json({ leaderboard });
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// User joins a quiz using quiz code
app.post("/user/join/:quizCode", middleware, async (req, res) => {
  const { quizCode } = req.params;
  const userId = req.user.userId;
  try {
    const quiz = await prisma.quiz.findUnique({ where: { code: quizCode } });
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    // Prevent duplicate join
    const existing = await prisma.session.findFirst({ where: { quizId: quiz.id, userId } });
    if (existing) {
      return res.status(200).json({ message: "Already joined", quizId: quiz.id });
    }
    await prisma.session.create({ data: { quizId: quiz.id, userId } });
    return res.status(201).json({ message: "Joined quiz", quizId: quiz.id });
  } catch (err) {
    console.error("Join quiz error:", err);
    return res.status(500).json({ error: "Failed to join quiz" });
  }
});

// User submits answer for current question
app.post("/user/submit/:questionId", middleware, async (req, res) => {
  const { questionId } = req.params;
  const userId = req.user.userId;
  const { quizId, optionId } = req.body;
  if (!quizId || !optionId) {
    return res.status(400).json({ error: "quizId and optionId required" });
  }
  try {
    // Remove previous response for this question by this user (if any)
    await prisma.response.deleteMany({ where: { userId, quizId: Number(quizId), questionId: Number(questionId) } });
    // Save new response
    const response = await prisma.response.create({
      data: {
        userId,
        quizId: Number(quizId),
        questionId: Number(questionId),
        optionId: Number(optionId)
      }
    });
    // Calculate leaderboard
    const quiz = await prisma.quiz.findUnique({
      where: { id: Number(quizId) },
      include: {
        responses: {
          include: {
            user: true,
            option: true
          }
        }
      }
    });
    const scoreMap = {};
    for (const resp of quiz.responses) {
      const { userId, user, option } = resp;
      if (!scoreMap[userId]) {
        scoreMap[userId] = {
          name: user.name,
          score: 0,
          totalQuestions: 0
        };
      }
      scoreMap[userId].totalQuestions += 1;
      if (option.isCorrect) {
        scoreMap[userId].score += 1;
      }
    }
    const leaderboard = Object.entries(scoreMap)
      .map(([userId, data]) => ({ userId: parseInt(userId), ...data }))
      .sort((a, b) => b.score - a.score);
    io.emit("update-leaderboard", { leaderboard });
    // Check if all questions are answered by all participants
    // (Simple version: if all questions for this quiz have responses from all sessions)
    const totalQuestions = quiz.questions?.length || 0;
    const totalParticipants = await prisma.session.count({ where: { quizId: Number(quizId) } });
    const responsesCount = await prisma.response.count({ where: { quizId: Number(quizId) } });
    if (totalQuestions > 0 && totalParticipants > 0 && responsesCount >= totalQuestions * totalParticipants) {
      // All questions answered by all participants
      io.emit("quiz-ended", { finalScores: leaderboard });
    }
    return res.status(201).json({ message: "Answer submitted", response });
  } catch (err) {
    console.error("Submit answer error:", err);
    return res.status(500).json({ error: "Failed to submit answer" });
  }
});

// Get quiz status & current question for user
app.get("/user/quiz/:quizId/status", middleware, async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.userId;
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: Number(quizId) },
      include: { questions: { include: { options: true } } }
    });
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    // Find the first unanswered question for this user
    const responses = await prisma.response.findMany({
      where: { quizId: Number(quizId), userId },
      select: { questionId: true }
    });
    const answeredIds = responses.map(r => r.questionId);
    const currentQuestion = quiz.questions.find(q => !answeredIds.includes(q.id));
    return res.json({
      quizId: quiz.id,
      status: currentQuestion ? "in_progress" : "completed",
      currentQuestion: currentQuestion ? {
        id: currentQuestion.id,
        text: currentQuestion.text,
        options: currentQuestion.options.map(o => ({ id: o.id, text: o.text }))
      } : null
    });
  } catch (err) {
    console.error("Quiz status error:", err);
    return res.status(500).json({ error: "Failed to get quiz status" });
  }
});

// Get current user's score for the quiz
app.get("/user/quiz/:quizId/score", middleware, async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.userId;
  try {
    const responses = await prisma.response.findMany({
      where: { quizId: Number(quizId), userId },
      include: { option: true }
    });
    const score = responses.filter(r => r.option.isCorrect).length;
    return res.json({ quizId: Number(quizId), userId, score, totalAnswered: responses.length });
  } catch (err) {
    console.error("User score error:", err);
    return res.status(500).json({ error: "Failed to get score" });
  }
});

// Get real-time quiz statistics
app.get("/quiz/:code/stats", async (req, res) => {
  const { code } = req.params;
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { code },
      include: {
        questions: {
          include: {
            options: {
              include: {
                responses: true
              }
            }
          }
        },
        sessions: {
          include: { user: true }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const stats = {
      quizId: quiz.id,
      title: quiz.title,
      isActive: quiz.isActive,
      currentQuestionId: quiz.currentQuestionId,
      totalParticipants: quiz.sessions.length,
      participants: quiz.sessions.map(session => ({
        id: session.user.id,
        name: session.user.name,
        joinedAt: session.joinedAt
      })),
      questions: quiz.questions.map(question => ({
        id: question.id,
        text: question.text,
        options: question.options.map(option => ({
          id: option.id,
          text: option.text,
          responseCount: option.responses.length
        }))
      }))
    };

    return res.json(stats);
  } catch (err) {
    console.error("Quiz stats error:", err);
    return res.status(500).json({ error: "Failed to get quiz statistics" });
  }
});

// Get live results for current question
app.get("/quiz/:code/question/:questionId/results", async (req, res) => {
  const { code, questionId } = req.params;
  try {
    const question = await prisma.question.findUnique({
      where: { id: parseInt(questionId) },
      include: {
        options: {
          include: {
            responses: {
              include: { user: true }
            }
          }
        },
        quiz: true
      }
    });

    if (!question || question.quiz.code !== code) {
      return res.status(404).json({ error: "Question not found" });
    }

    const results = {
      questionId: question.id,
      questionText: question.text,
      options: question.options.map(option => ({
        id: option.id,
        text: option.text,
        responseCount: option.responses.length,
        responses: option.responses.map(response => ({
          userId: response.userId,
          userName: response.user.name
        }))
      })),
      totalResponses: question.options.reduce((sum, option) => sum + option.responses.length, 0)
    };

    return res.json(results);
  } catch (err) {
    console.error("Question results error:", err);
    return res.status(500).json({ error: "Failed to get question results" });
  }
});

// Join quiz with WebSocket support
app.post("/quiz/:code/join", middleware, async (req, res) => {
  const { code } = req.params;
  const userId = req.user.userId;
  
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { code },
      include: { sessions: true }
    });

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Check if user already joined
    const existingSession = await prisma.session.findFirst({
      where: { quizId: quiz.id, userId }
    });

    if (existingSession) {
      return res.json({ 
        message: "Already joined", 
        quizId: quiz.id,
        isActive: quiz.isActive,
        currentQuestionId: quiz.currentQuestionId
      });
    }

    // Create new session
    await prisma.session.create({
      data: { quizId: quiz.id, userId }
    });

    return res.json({ 
      message: "Successfully joined quiz", 
      quizId: quiz.id,
      isActive: quiz.isActive,
      currentQuestionId: quiz.currentQuestionId,
      totalParticipants: quiz.sessions.length + 1
    });
  } catch (err) {
    console.error("Join quiz error:", err);
    return res.status(500).json({ error: "Failed to join quiz" });
  }
});

// Submit answer with real-time updates
app.post("/quiz/:code/question/:questionId/answer", middleware, async (req, res) => {
  const { code, questionId } = req.params;
  const { optionId } = req.body;
  const userId = req.user.userId;

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { code },
      include: { questions: true }
    });

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const question = quiz.questions.find(q => q.id === parseInt(questionId));
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Remove previous response for this question by this user
    await prisma.response.deleteMany({
      where: { userId, quizId: quiz.id, questionId: parseInt(questionId) }
    });

    // Create new response
    const response = await prisma.response.create({
      data: {
        userId,
        quizId: quiz.id,
        questionId: parseInt(questionId),
        optionId: parseInt(optionId)
      }
    });

    // Get updated statistics
    const questionWithOptions = await prisma.question.findUnique({
      where: { id: parseInt(questionId) },
      include: {
        options: {
          include: { responses: true }
        }
      }
    });

    const optionCounts = {};
    questionWithOptions.options.forEach(option => {
      optionCounts[option.id] = option.responses.length;
    });

    return res.json({
      message: "Answer submitted successfully",
      response,
      optionCounts,
      totalResponses: questionWithOptions.options.reduce((sum, option) => sum + option.responses.length, 0)
    });
  } catch (err) {
    console.error("Submit answer error:", err);
    return res.status(500).json({ error: "Failed to submit answer" });
  }
});


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});