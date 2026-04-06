import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '../../uploads');
const assignmentsDir = path.join(uploadsDir, 'assignments');
const submissionsDir = path.join(uploadsDir, 'submissions');
const profilesDir = path.join(uploadsDir, 'profiles');

[uploadsDir, assignmentsDir, submissionsDir, profilesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage for assignments
const assignmentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, assignmentsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

// Configure storage for submissions
const submissionStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, submissionsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

// File filter for allowed file types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip',
        'application/x-zip-compressed'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, and ZIP files are allowed.'));
    }
};

// Multer upload configurations
export const uploadAssignment = multer({
    storage: assignmentStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    }
}).single('file');

export const uploadSubmission = multer({
    storage: submissionStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    }
}).single('file');

// ── AI Question Extraction upload ──────────────────────────────────────────────
const aiTempDir = path.join(uploadsDir, 'ai-temp');
if (!fs.existsSync(aiTempDir)) {
    fs.mkdirSync(aiTempDir, { recursive: true });
}

const aiFileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, aiTempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `ai-${uniqueSuffix}${ext}`);
    }
});

const aiFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = [
        'application/pdf',
        'text/plain',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, PPT, PPTX, and TXT files are allowed for AI extraction.'));
    }
};

export const uploadAiFile = multer({
    storage: aiFileStorage,
    fileFilter: aiFileFilter,
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB
}).single('file');

// ── Profile Photo Upload ──────────────────────────────────────────────────────
const profilePhotoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profilesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `profile-${uniqueSuffix}${ext}`);
    }
});

const profilePhotoFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'));
    }
};

export const uploadProfilePhoto = multer({
    storage: profilePhotoStorage,
    fileFilter: profilePhotoFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).single('photo');
