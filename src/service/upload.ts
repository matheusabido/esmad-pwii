import multer from "multer";
import mime from "mime-types";
import { MAX_FILE_SIZE } from "@/config/files.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "tmp/");
  },
  filename: (req, file, cb) => {
    const ext = mime.extension(file.mimetype);

    if (!ext) {
      return cb(new Error("Tipo de arquivo inválido"), "");
    }

    const filename = `${Date.now()}.${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
});

export default upload;
