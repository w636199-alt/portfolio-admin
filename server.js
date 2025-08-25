import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Directories
const projectDir = path.join(process.cwd(), "uploads/projects");
const resumeDir = path.join(process.cwd(), "uploads/resume");
const clientProjectDir = path.join(process.cwd(), "../client/uploads/projects");
const clientResumeDir = path.join(process.cwd(), "../client/uploads/resume");

// Create folders if they don't exist
[projectDir, resumeDir, clientProjectDir, clientResumeDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer storage
const projectUpload = multer({
  storage: multer.diskStorage({
    destination: projectDir,
    filename: (req, file, cb) => cb(null, file.originalname),
  }),
});

const resumeUpload = multer({
  storage: multer.diskStorage({
    destination: resumeDir,
    filename: (req, file, cb) => cb(null, file.originalname),
  }),
});

// Helper: copy file to client folder
function copyToClient(filePath, clientDir, fileName) {
  fs.copyFileSync(filePath, path.join(clientDir, fileName));
}

// ---------------- Routes ----------------

// Upload project image (keeps previous images, no deletion)
app.post("/upload-project-image", projectUpload.single("projectImage"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const newPath = `/uploads/projects/${req.file.filename}`;

  // Copy to client folder
  copyToClient(path.join(projectDir, req.file.filename), clientProjectDir, req.file.filename);

  res.json({ path: newPath });
});

// Upload resume
app.post("/upload-resume", resumeUpload.single("resumeFile"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const newPath = `/uploads/resume/${req.file.filename}`;

  // Copy to client folder
  copyToClient(path.join(resumeDir, req.file.filename), clientResumeDir, req.file.filename);

  res.json({ path: newPath });
});

// Delete resume explicitly
app.post("/delete-resume", express.json(), (req, res) => {
  const { filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: "No file path provided" });

  const serverPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(serverPath)) fs.unlinkSync(serverPath);  // delete from admin/server

  const clientPath = path.join(clientResumeDir, path.basename(filePath));
  if (fs.existsSync(clientPath)) fs.unlinkSync(clientPath);  // delete from client

  res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
