import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// --- Directories ---
const projectDir = path.join(process.cwd(), "uploads/projects");
const resumeDir = path.join(process.cwd(), "uploads/resume");

// Ensure directories exist
[projectDir, resumeDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// --- Multer storage ---
// Project images
const projectStorage = multer.diskStorage({
  destination: projectDir,
  filename: (req, file, cb) => {
    const projectId = req.body.projectId;
    if (!projectId) return cb(new Error("projectId is required"));
    const ext = path.extname(file.originalname);
    cb(null, `image_${projectId}${ext}`);
  }
});
const projectUpload = multer({ storage: projectStorage });

// Resume
const resumeStorage = multer.diskStorage({
  destination: resumeDir,
  filename: (req, file, cb) => cb(null, "resume.pdf") // overwrite always
});
const resumeUpload = multer({ storage: resumeStorage });

// --- Routes ---
// Upload project image
app.post("/upload-project-image", projectUpload.single("projectImage"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filename = req.file.filename;
  const filePath = path.join(projectDir, filename);

  // Overwrite if exists (multer already saves as temp, so just ensure)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  fs.renameSync(req.file.path, filePath);

  const localUrl = `/uploads/projects/${filename}`;
  const gitUrl = `https://raw.githubusercontent.com/w636199-alt/portfolio/main/uploads/projects/${filename}`;
  res.json({ localUrl, gitUrl, filename });
});

// Upload resume
app.post("/upload-resume", resumeUpload.single("resumeFile"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filename = req.file.filename;
  const filePath = path.join(resumeDir, filename);

  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  fs.renameSync(req.file.path, filePath);

  const localUrl = `/uploads/resume/${filename}`;
  const gitUrl = `https://raw.githubusercontent.com/w636199-alt/portfolio/main/uploads/resume/${filename}`;
  res.json({ localUrl, gitUrl, filename });
});

// Delete project image
app.post("/delete-project-image", (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: "No filename provided" });

  const filePath = path.join(projectDir, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  res.json({ success: true });
});

// Delete resume
app.post("/delete-resume", (req, res) => {
  const { filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: "No file path provided" });

  const filename = path.basename(filePath);
  const resumePath = path.join(resumeDir, filename);
  if (fs.existsSync(resumePath)) fs.unlinkSync(resumePath);

  res.json({ success: true });
});

// Start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
