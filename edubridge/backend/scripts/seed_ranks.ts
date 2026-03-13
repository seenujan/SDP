import { pool } from '../src/config/database';
import { recalculateClassRanks } from '../src/services/RankService';

async function seedAllRanks() {
    const [classes]: any = await pool.query('SELECT id FROM classes');
    console.log(`Found ${classes.length} classes. Recalculating ranks...`);

    for (const cls of classes) {
        try {
            await recalculateClassRanks(cls.id);
            console.log(`  ✅ Class ${cls.id} done`);
        } catch (e: any) {
            console.error(`  ❌ Class ${cls.id} failed: ${e.message}`);
        }
    }

    // Show sample result
    const [sample]: any = await pool.query(
        'SELECT id, full_name, class_id, class_rank FROM students WHERE class_rank IS NOT NULL LIMIT 10'
    );
    console.log('\nSample results:');
    sample.forEach((s: any) => console.log(`  ${s.full_name} (class ${s.class_id}) => Rank #${s.class_rank}`));

    await pool.end();
}

seedAllRanks().catch(e => { console.error('Error:', e.message, e.stack); process.exit(1); });
