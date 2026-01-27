const fs = require('fs');
const path = require('path');

const filesToDelete = [
    // Backend Root
    'c:\\SDP\\edubridge\\backend\\src\\services\\PortfolioService.ts',
    'c:\\SDP\\edubridge\\backend\\check_schema.ts',
    'c:\\SDP\\edubridge\\backend\\check_score_column.ts',
    'c:\\SDP\\edubridge\\backend\\debug_output.txt',
    'c:\\SDP\\edubridge\\backend\\debug_result.txt',
    'c:\\SDP\\edubridge\\backend\\schema_output.txt',
    'c:\\SDP\\edubridge\\backend\\schema_output_v2.txt',
    'c:\\SDP\\edubridge\\backend\\schema_full.txt',

    // Scripts (Migrations & One-offs)
    'c:\\SDP\\edubridge\\backend\\scripts\\add_score_column.js',
    'c:\\SDP\\edubridge\\backend\\scripts\\attendance_refactor.ts',
    'c:\\SDP\\edubridge\\backend\\scripts\\check_all_db_info.js',
    'c:\\SDP\\edubridge\\backend\\scripts\\check_engine.js',
    'c:\\SDP\\edubridge\\backend\\scripts\\check_exams_data.ts',
    'c:\\SDP\\edubridge\\backend\\scripts\\check_schema_temp.js',
    'c:\\SDP\\edubridge\\backend\\scripts\\clean_constraints.ts',
    'c:\\SDP\\edubridge\\backend\\scripts\\create_notifications_table.js',
    'c:\\SDP\\edubridge\\backend\\scripts\\create_password_reset_table.js',
    'c:\\SDP\\edubridge\\backend\\scripts\\debug_exams_error.ts',
    'c:\\SDP\\edubridge\\backend\\scripts\\debug_marks_dump.ts',
    'c:\\SDP\\edubridge\\backend\\scripts\\drop_exam_columns.ts',
    'c:\\SDP\\edubridge\\backend\\scripts\\final_fix_portfolios.ts',
    'c:\\SDP\\edubridge\\backend\\scripts\\fix_portfolios_migration.ts',
    'c:\\SDP\\edubridge\\backend\\scripts\\inspect_portfolios.js',
    'c:\\SDP\\edubridge\\backend\\scripts\\inspect_schema.js',
    'c:\\SDP\\edubridge\\backend\\scripts\\list_fks.js',
    'c:\\SDP\\edubridge\\backend\\scripts\\migrate_token_history.js',
    'c:\\SDP\\edubridge\\backend\\scripts\\portfolios_refactor.ts',
    'c:\\SDP\\edubridge\\backend\\scripts\\remove_class_teacher_id.ts',
    'c:\\SDP\\edubridge\\backend\\scripts\\remove_exam_attempts_score.ts',
    'c:\\SDP\\edubridge\\backend\\scripts\\remove_exams_total_marks.ts',
    'c:\\SDP\\edubridge\\backend\\scripts\\remove_term_marks_teacher_id.ts',
    'c:\\SDP\\edubridge\\backend\\scripts\\reproduce_transaction.js',
    'c:\\SDP\\edubridge\\backend\\scripts\\restore_exams_total_marks.ts',
    'c:\\SDP\\edubridge\\backend\\scripts\\strict_3nf_migration.ts',
    'c:\\SDP\\edubridge\\backend\\scripts\\test_portfolio_insert.ts',
    'c:\\SDP\\edubridge\\backend\\scripts\\verify_registration_fix.ts',
    'c:\\SDP\\edubridge\\backend\\scripts\\verify_schema_simple.js'
];

filesToDelete.forEach(file => {
    try {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            console.log(`Deleted: ${file}`);
        } else {
            console.log(`Skipped (not found): ${file}`);
        }
    } catch (error) {
        console.error(`Error deleting ${file}:`, error.message);
    }
});
