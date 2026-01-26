import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dashboardService } from '../services/DashboardService';
import { userService } from '../services/UserService';
import { announcementService, eventService } from '../services/AnnouncementService';
import { studentPortfolioService } from '../services/StudentPortfolioService';
import certificateService from '../services/CertificateService';
import { reportService } from '../services/ReportService';
import { subjectService } from '../services/SubjectService';

export class AdminController {
    // User Management
    async toggleUserStatus(req: AuthRequest, res: Response) {
        try {
            const userId = parseInt(req.params.id);
            // Default to true (activate) if not provided, or toggle existing? 
            // Better to expect a target status or just toggle.
            // Let's implement toggle.
            // First get current status
            const user = await userService.getUserById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const newStatus = !user.active;
            await userService.updateUser(userId, { active: newStatus });

            res.json({ success: true, active: newStatus, message: `User ${newStatus ? 'activated' : 'deactivated'} successfully` });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async createParent(req: AuthRequest, res: Response) {
        try {
            const { email, fullName, phone } = req.body;
            if (!email || !fullName || !phone) {
                return res.status(400).json({ error: 'Email, Full Name, and Phone are required' });
            }

            const user = await userService.createUser({
                email,
                role: 'parent',
                fullName,
                additionalData: { phone }
            });
            res.status(201).json(user);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async createStudent(req: AuthRequest, res: Response) {
        try {
            const { email, fullName, dateOfBirth, grade, section, parentId } = req.body;

            // Validate required fields
            if (!email || !fullName || !grade || !section) {
                return res.status(400).json({ error: 'Email, Full Name, Grade, and Section are required' });
            }

            const user = await userService.createUser({
                email,
                role: 'student',
                fullName,
                additionalData: {
                    dateOfBirth,
                    grade,
                    section,
                    parentId: parentId ? parseInt(parentId) : null
                }
            });
            res.status(201).json(user);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async createTeacher(req: AuthRequest, res: Response) {
        try {
            const { email, fullName, subjectId } = req.body;

            if (!email || !fullName || !subjectId) {
                return res.status(400).json({ error: 'Email, Full Name, and Subject are required' });
            }

            const user = await userService.createUser({
                email,
                role: 'teacher',
                fullName,
                additionalData: { subjectId }
            });
            res.status(201).json(user);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // GET /api/admin/dashboard
    async getDashboard(req: AuthRequest, res: Response) {
        try {
            const data = await dashboardService.getAdminDashboard();
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Announcements
    async createAnnouncement(req: AuthRequest, res: Response) {
        try {
            const announcement = await announcementService.createAnnouncement({
                ...req.body,
                postedBy: req.user!.id,
            });
            res.status(201).json(announcement);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getAnnouncements(req: AuthRequest, res: Response) {
        try {
            const announcements = await announcementService.getAllAnnouncements();
            res.json(announcements);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateAnnouncement(req: AuthRequest, res: Response) {
        try {
            const announcement = await announcementService.updateAnnouncement(
                parseInt(req.params.id),
                req.body
            );
            res.json(announcement);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async deleteAnnouncement(req: AuthRequest, res: Response) {
        try {
            await announcementService.deleteAnnouncement(parseInt(req.params.id));
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Events
    async createEvent(req: AuthRequest, res: Response) {
        try {
            const event = await eventService.createEvent({
                ...req.body,
                createdBy: req.user!.id,
            });
            res.status(201).json(event);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getEvents(req: AuthRequest, res: Response) {
        try {
            const events = await eventService.getAllEvents();
            res.json(events);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateEvent(req: AuthRequest, res: Response) {
        try {
            const event = await eventService.updateEvent(
                parseInt(req.params.id),
                req.body
            );
            res.json(event);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async deleteEvent(req: AuthRequest, res: Response) {
        try {
            await eventService.deleteEvent(parseInt(req.params.id));
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Student Portfolio Management
    // Get available grades
    async getGrades(req: AuthRequest, res: Response) {
        try {
            const grades = await userService.getAvailableGrades();
            res.json(grades);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get all subjects
    async getSubjects(req: AuthRequest, res: Response) {
        try {
            const subjects = await subjectService.getAllSubjects();
            res.json(subjects);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get sections for a grade
    async getSectionsForGrade(req: AuthRequest, res: Response) {
        try {
            const { grade } = req.params;
            const sections = await userService.getSectionsForGrade(grade);
            res.json(sections);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get students filtered by grade and section
    async getStudentsByFilter(req: AuthRequest, res: Response) {
        try {
            const { grade, section } = req.query;
            const students = await studentPortfolioService.getStudentsByFilter(
                grade as string,
                section as string
            );
            res.json(students);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get student portfolio with all entries
    async getStudentPortfolio(req: AuthRequest, res: Response) {
        try {
            const studentId = parseInt(req.params.studentId);
            const portfolio = await studentPortfolioService.getStudentPortfolio(studentId);
            res.json(portfolio);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Update portfolio entry
    async updatePortfolioEntry(req: AuthRequest, res: Response) {
        try {
            const entryId = parseInt(req.params.entryId);
            const updated = await studentPortfolioService.updatePortfolioEntry(entryId, req.body);
            res.json(updated);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // Delete portfolio entry
    async deletePortfolioEntry(req: AuthRequest, res: Response) {
        try {
            const entryId = parseInt(req.params.entryId);
            await studentPortfolioService.deletePortfolioEntry(entryId);
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Certificate Management

    // Get all certificates
    async getAllCertificates(req: AuthRequest, res: Response) {
        try {
            const certificates = await certificateService.getAllCertificates();
            res.json(certificates);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Create certificate
    async createCertificate(req: AuthRequest, res: Response) {
        try {
            console.log('Create certificate request:', {
                body: req.body,
                userId: req.user?.id,
                userEmail: req.user?.email
            });

            if (!req.user?.id) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const certificate = await certificateService.createCertificate({
                studentId: req.body.studentId,
                certificateTypeId: req.body.certificateTypeId,
                description: req.body.description,
                issueDate: req.body.issueDate,
                issuedBy: req.user.id
            });

            console.log('Certificate created successfully:', certificate);
            res.status(201).json(certificate);
        } catch (error: any) {
            console.error('Failed to create certificate:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Delete certificate
    async getCertificateTypes(req: AuthRequest, res: Response) {
        try {
            const types = await certificateService.getCertificateTypes();
            res.json(types);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteCertificate(req: AuthRequest, res: Response) {
        try {
            const id = parseInt(req.params.id);
            await certificateService.deleteCertificate(id);
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get progress card data for a student
    async getProgressCardData(req: AuthRequest, res: Response) {
        try {
            const studentId = parseInt(req.params.studentId);
            const termId = req.query.termId ? parseInt(req.query.termId as string) : undefined;

            // Get student info
            const studentInfo = await studentPortfolioService.getStudentPortfolio(studentId);

            // Get marks (you'll need to implement this based on your marks table structure)
            // For now, returning placeholder
            const progressData = {
                student: studentInfo.student,
                portfolio: studentInfo.portfolioEntries,
                // TODO: Add marks and attendance data when those services are available
                marks: [],
                attendance: {}
            };

            res.json(progressData);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
    // Reports
    async getAttendanceReport(req: AuthRequest, res: Response) {
        try {
            const { classId, startDate, endDate } = req.query;
            const report = await reportService.getAttendanceReport(
                classId ? parseInt(classId as string) : null,
                startDate as string,
                endDate as string
            );
            res.json(report);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getExamReport(req: AuthRequest, res: Response) {
        try {
            const { grade, examId } = req.query;
            const report = await reportService.getExamReport(
                grade as string,
                examId ? parseInt(examId as string) : null
            );
            res.json(report);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const adminController = new AdminController();
