
import React, { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    CheckCircle2,
    Circle,
    Calendar,
    X,
    AlertCircle
} from 'lucide-react';
import { studentAPI } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';

interface Todo {
    id: number;
    title: string;
    description: string;
    due_date: string;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'in_progress' | 'completed';
    category: string;
    created_at: string;
}

const ToDoList: React.FC = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    // New Task Form State
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        category: 'general'
    });

    const fetchTodos = async () => {
        try {
            setLoading(true);
            const response = await studentAPI.getTodos();
            console.log('Todos fetched:', response.data);
            setTodos(response.data);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching todos:', err);
            setError('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodos();
    }, []);

    const handleCreateTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await studentAPI.createTodo({
                title: newTask.title,
                description: newTask.description,
                dueDate: newTask.dueDate || null,
                priority: newTask.priority,
                category: newTask.category
            });
            setShowModal(false);
            setNewTask({
                title: '',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'general'
            });
            fetchTodos();
        } catch (err: any) {
            console.error('Error creating todo:', err);
            alert('Failed to create task');
        }
    };

    const handleDeleteTodo = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await studentAPI.deleteTodo(id);
            setTodos(todos.filter(t => t.id !== id));
        } catch (err) {
            console.error('Error deleting todo:', err);
            alert('Failed to delete task');
        }
    };

    const handleToggleStatus = async (id: number) => {
        try {
            await studentAPI.toggleTodoStatus(id);
            // Optimistically update UI
            setTodos(todos.map(t => {
                if (t.id === id) {
                    return {
                        ...t,
                        status: t.status === 'completed' ? 'pending' : 'completed'
                    };
                }
                return t;
            }));
        } catch (err) {
            console.error('Error toggling status:', err);
            fetchTodos(); // Revert on error
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My To-Do List</h1>
                        <p className="text-gray-500 mt-1">Manage your tasks and study schedule</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus size={20} />
                        <span>Add New Task</span>
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-sm">Pending Tasks</p>
                        <p className="text-2xl font-bold text-orange-600">
                            {todos.filter(t => t.status !== 'completed').length}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-sm">Completed</p>
                        <p className="text-2xl font-bold text-green-600">
                            {todos.filter(t => t.status === 'completed').length}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-sm">High Priority</p>
                        <p className="text-2xl font-bold text-red-600">
                            {todos.filter(t => t.priority === 'high' && t.status !== 'completed').length}
                        </p>
                    </div>
                </div>

                {/* Task List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="font-semibold text-gray-700">All Tasks</h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading tasks...</div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-500 flex flex-col items-center">
                            <AlertCircle className="mb-2" />
                            {error}
                        </div>
                    ) : todos.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                            <CheckCircle2 size={48} className="mb-4 opacity-50" />
                            <p>No tasks yet! Add one to get started.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {todos.map((todo) => (
                                <div
                                    key={todo.id}
                                    className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${todo.status === 'completed' ? 'bg-gray-50/50' : ''
                                        }`}
                                >
                                    {/* Status Toggle */}
                                    <button
                                        onClick={() => handleToggleStatus(todo.id)}
                                        className={`flex-shrink-0 transition-colors ${todo.status === 'completed'
                                            ? 'text-green-500 hover:text-green-600'
                                            : 'text-gray-300 hover:text-primary-600'
                                            }`}
                                    >
                                        {todo.status === 'completed' ? (
                                            <CheckCircle2 size={24} />
                                        ) : (
                                            <Circle size={24} />
                                        )}
                                    </button>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className={`font-medium truncate ${todo.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'
                                                }`}>
                                                {todo.title}
                                            </h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(todo.priority)}`}>
                                                {todo.priority}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                                {todo.category}
                                            </span>
                                        </div>
                                        <p className={`text-sm ${todo.status === 'completed' ? 'text-gray-400' : 'text-gray-500'
                                            }`}>
                                            {todo.description}
                                        </p>
                                        {todo.due_date && (
                                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                                <Calendar size={12} />
                                                <span>Due: {new Date(todo.due_date).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <button
                                        onClick={() => handleDeleteTodo(todo.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add Task Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                <h3 className="font-semibold text-gray-900">Add New Task</h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTodo} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        placeholder="Enter task title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                                        rows={3}
                                        placeholder="Enter task description"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            value={newTask.dueDate}
                                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={newTask.category}
                                        onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    >
                                        <option value="general">General</option>
                                        <option value="study">Study</option>
                                        <option value="assignment">Assignment</option>
                                        <option value="exam">Exam</option>
                                        <option value="project">Project</option>
                                    </select>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        Add Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ToDoList;
