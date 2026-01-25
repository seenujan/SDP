import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface TodoData {
    studentId: number;
    title: string;
    description?: string;
    dueDate?: string;
    priority?: 'high' | 'medium' | 'low';
    status?: 'pending' | 'in_progress' | 'completed';
    category?: string;
}

export class TodoService {
    // Get all todos for a student
    static async getStudentTodos(studentId: number) {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT * FROM student_todos 
             WHERE student_id = ? 
             ORDER BY 
                CASE priority 
                    WHEN 'high' THEN 1 
                    WHEN 'medium' THEN 2 
                    WHEN 'low' THEN 3 
                END,
                due_date ASC`,
            [studentId]
        );
        return rows;
    }

    // Create a new todo
    static async createTodo(data: TodoData) {
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO student_todos 
             (student_id, title, description, due_date, priority, status, category) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                data.studentId,
                data.title,
                data.description || null,
                data.dueDate || null,
                data.priority || 'medium',
                data.status || 'pending',
                data.category || 'general'
            ]
        );
        return result.insertId;
    }

    // Update todo
    static async updateTodo(todoId: number, studentId: number, data: Partial<TodoData>) {
        const updates: string[] = [];
        const values: any[] = [];

        if (data.title !== undefined) {
            updates.push('title = ?');
            values.push(data.title);
        }
        if (data.description !== undefined) {
            updates.push('description = ?');
            values.push(data.description);
        }
        if (data.dueDate !== undefined) {
            updates.push('due_date = ?');
            values.push(data.dueDate);
        }
        if (data.priority !== undefined) {
            updates.push('priority = ?');
            values.push(data.priority);
        }
        if (data.status !== undefined) {
            updates.push('status = ?');
            values.push(data.status);

            // Set completed_at when status changes to completed
            if (data.status === 'completed') {
                updates.push('completed_at = CURRENT_TIMESTAMP');
            } else {
                updates.push('completed_at = NULL');
            }
        }
        if (data.category !== undefined) {
            updates.push('category = ?');
            values.push(data.category);
        }

        if (updates.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(todoId, studentId);

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE student_todos 
             SET ${updates.join(', ')} 
             WHERE id = ? AND student_id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    // Delete todo
    static async deleteTodo(todoId: number, studentId: number) {
        const [result] = await pool.query<ResultSetHeader>(
            'DELETE FROM student_todos WHERE id = ? AND student_id = ?',
            [todoId, studentId]
        );
        return result.affectedRows > 0;
    }

    // Get todo by ID
    static async getTodoById(todoId: number, studentId: number) {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM student_todos WHERE id = ? AND student_id = ?',
            [todoId, studentId]
        );
        return rows[0];
    }

    // Toggle todo status
    static async toggleTodoStatus(todoId: number, studentId: number) {
        const todo = await this.getTodoById(todoId, studentId);
        if (!todo) {
            throw new Error('Todo not found');
        }

        const newStatus = todo.status === 'completed' ? 'pending' : 'completed';

        // Pass the studentId correctly
        return await this.updateTodo(todoId, studentId, { status: newStatus });
    }
}
