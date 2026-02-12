
export interface LeaveType {
    id: number;
    name: string;
    default_annual_quota: number;
    description: string;
}

export interface LeaveBalance {
    type_id: number;
    name: string;
    quota: number;
    used: number;
    remaining: number | 'Unlimited';
}

export interface TeacherLeave {
    id: number;
    teacher_id: number;
    teacher_name?: string;
    class_names?: string;
    leave_type_id: number;
    leave_type_name?: string;
    start_date: string;
    end_date: string;
    is_half_day: boolean;
    reason: string;
    relief_teacher_id: number;
    relief_teacher_name?: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    relief_status?: 'Pending' | 'Approved' | 'Rejected';
    relief_rejection_reason?: string;
    rejection_reason?: string;
    created_at: string;
    applicant_name?: string; // For relief requests view

}

export interface LeaveApplicationPayload {
    leave_type_id: number;
    start_date: string;
    end_date: string;
    is_half_day: boolean;
    reason: string;
    relief_teacher_id: number;
}
