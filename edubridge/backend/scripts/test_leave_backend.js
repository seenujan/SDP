
const API_URL = 'http://localhost:5000/api';

(async () => {
    try {
        // 1. Login
        console.log('1. Logging in as teacher01...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'teacher01@gmail.com',
                password: 'teacher01'
            })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);
        const loginData = await loginRes.json();
        const token = loginData.token;
        const myId = loginData.user.id;
        console.log(`Login OK. User ID: ${myId}`);

        // 2. Get Types
        console.log('2. Fetching leave types...');
        const typesRes = await fetch(`${API_URL}/teacher/leave/types`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!typesRes.ok) throw new Error(`Get Types failed: ${typesRes.statusText}`);
        const typesData = await typesRes.json();
        if (typesData.length === 0) throw new Error('No leave types found');
        const typeId = typesData[0].id; // e.g., Casual Leave
        console.log(`Using Leave Type ID: ${typeId}`);

        // 3. Get Relief Teacher (Mocking with ID 2, assuming database has multiple teachers)
        // Ideally we should fetch from /timetable/teachers-dropdown, but assuming '2' exists.
        // Or query DB? Let's check logic: applyLeave checks if relief teacher exists?
        // Let's try to fetch recent teacher from /timetable/teachers-dropdown if possible, 
        // but that endpoint wasn't in my focus list.
        // Let's try ID 2 (teacher02). If I am teacher01 (ID 1?), teacher02 should be 2.
        const reliefTeacherId = (myId === 1) ? 2 : 1;

        // 4. Apply for Leave
        console.log('4. Applying for leave...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        const payload = {
            leave_type_id: typeId,
            start_date: dateStr,
            end_date: dateStr,
            is_half_day: false,
            reason: 'Automated Backend Test Leave via Fetch',
            relief_teacher_id: reliefTeacherId
        };

        const applyRes = await fetch(`${API_URL}/teacher/leave`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const result = await applyRes.json();
        if (!applyRes.ok) throw new Error(`Apply Leave failed: ${JSON.stringify(result)}`);

        console.log('SUCCESS: Leave Applied!');
        console.log('Response:', result);

    } catch (err) {
        console.error('FAILED:', err.message);
    }
})();
