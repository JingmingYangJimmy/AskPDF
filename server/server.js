import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer"; // Import multer
import chat from "./chat.js";

dotenv.config();

const app = express();

app.use(cors());

//config multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

const PORT = 5001;

let filePath;

app.post("/upload", upload.single("file"), async (req, res) => {
  filePath = req.file.path;
  res.send(filePath + "upload successfully.");
});

app.get("/chat", async (req, res) => {
  const response = await chat(filePath, req.query.question);

  res.send(response.text);
});

app.listen(PORT, () => {
  console.log("Server is running!", PORT);
});
