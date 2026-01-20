import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { userService } from '../services/UserService';

export class UserController {
    // GET /api/admin/users - Get all users
    async getAllUsers(req: AuthRequest, res: Response) {
        try {
            const users = await userService.getAllUsers();
            res.json(users);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/admin/users/:id - Get user by ID
    async getUserById(req: AuthRequest, res: Response) {
        try {
            const user = await userService.getUserById(parseInt(req.params.id));
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // POST /api/admin/users - Create user
    async createUser(req: AuthRequest, res: Response) {
        try {
            const user = await userService.createUser(req.body);
            res.status(201).json(user);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // PUT /api/admin/users/:id - Update user
    async updateUser(req: AuthRequest, res: Response) {
        try {
            const user = await userService.updateUser(parseInt(req.params.id), req.body);
            res.json(user);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // DELETE /api/admin/users/:id - Delete user
    async deleteUser(req: AuthRequest, res: Response) {
        try {
            const result = await userService.deleteUser(parseInt(req.params.id));
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // GET /api/admin/users/students - Get all students
    async getStudents(req: AuthRequest, res: Response) {
        try {
            const students = await userService.getStudents();
            res.json(students);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/admin/users/teachers - Get all teachers
    async getTeachers(req: AuthRequest, res: Response) {
        try {
            const teachers = await userService.getTeachers();
            res.json(teachers);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/admin/users/parents - Get all parents
    async getParents(req: AuthRequest, res: Response) {
        try {
            const parents = await userService.getParents();
            res.json(parents);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/admin/users/parents-dropdown - Get parents for dropdown
    async getParentsForDropdown(req: AuthRequest, res: Response) {
        try {
            const parents = await userService.getParentsForDropdown();
            res.json(parents);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/admin/classes - Get all classes
    async getClasses(req: AuthRequest, res: Response) {
        try {
            const classes = await userService.getClasses();
            res.json(classes);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const userController = new UserController();
