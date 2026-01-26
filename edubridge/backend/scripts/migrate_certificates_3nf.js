const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function migrateCertificates() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB...');

        // 1. Create certificate_types table if not exists
        console.log('Creating certificate_types table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS certificate_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Add certificate_type_id to certificates
        console.log('Adding certificate_type_id column...');
        try {
            await connection.query(`ALTER TABLE certificates ADD COLUMN certificate_type_id INT`);
            await connection.query(`ALTER TABLE certificates ADD CONSTRAINT fk_cert_type FOREIGN KEY (certificate_type_id) REFERENCES certificate_types(id) ON DELETE CASCADE`);
        } catch (e) {
            console.log('Column/Key might already exist:', e.message);
        }

        // 3. Migrate Data
        console.log('Migrating data...');
        // Get all unique combinations of title/description/type from certificates
        // The user request said: "certificate_type -> title, description"
        // And "Remove: certificate_type, title, description"

        // Strategy:
        // We treat the old record's `certificate_type` as the 'name' of the new type?
        // OR `title` as the name?
        // User said: "certificate_type_id INT" replacing "certificate_type, title, description".
        // And "Create: certificate_types(id, name, description)"

        // Let's assume:
        // certificate_types.name = old certificates.certificate_type (e.g. "Achievement")
        // certificate_types.description = old certificates.description
        // But what about `title`? 
        // Example: Type="Achievement", Title="1st Place Science", Desc="Good job"
        // If we move Title to certificate_types, then every specific award needs a new Type.
        // e.g. Type "1st Place Science"

        // Re-reading user request: "certificate_type -> title, description"
        // This implies the Type ENTITY defines the default title and description.
        // If the user wants to remove `title` from `certificates`, then `title` MUST be in `certificate_types`.

        // So, for every unique combination of (certificate_type, title, description) in `certificates`,
        // we create a `certificate_types` record.

        const [records] = await connection.query(`SELECT id, certificate_type, title, description FROM certificates`);

        for (const record of records) {
            if (!record.certificate_type) continue; // Should be not null

            // Check if this type already exists in new table
            // We use 'title' as the unique identifier for the type? 
            // Or 'certificate_type' (category)?
            // If we remove title from certificates, the title MUST effectively be the name of the type.

            // Let's use:
            // name = record.title (The specific award name)
            // description = record.description
            // (We might lose the broad category 'certificate_type' unless we prepend it or store it)
            // Or maybe: name = record.certificate_type + " - " + record.title?
            // "Achievement Certificate - 1st Place"

            // Let's go with: name = record.title (It seems most descriptive).
            // But wait, if multiple students get "1st Place", we want them to share the ID.

            const [existingTypes] = await connection.query(
                `SELECT id FROM certificate_types WHERE name = ? AND (description = ? OR (description IS NULL AND ? IS NULL))`,
                [record.title, record.description, record.description]
            );

            let typeId;
            if (existingTypes.length > 0) {
                typeId = existingTypes[0].id;
            } else {
                const [res] = await connection.query(
                    `INSERT INTO certificate_types (name, description) VALUES (?, ?)`,
                    [record.title, record.description]
                );
                typeId = res.insertId;
                console.log(`Created Type: ${record.title} (ID: ${typeId})`);
            }

            // Update certificate
            await connection.query(`UPDATE certificates SET certificate_type_id = ? WHERE id = ?`, [typeId, record.id]);
        }

        console.log('Data migration completed.');

        // 4. Drop old columns
        console.log('Dropping old columns...');
        try {
            await connection.query(`ALTER TABLE certificates DROP COLUMN certificate_type`);
            await connection.query(`ALTER TABLE certificates DROP COLUMN title`);
            await connection.query(`ALTER TABLE certificates DROP COLUMN description`);
        } catch (e) {
            console.log('Error dropping columns:', e.message);
        }

        console.log('Migration Successfully Completed!');

    } catch (error) {
        console.error('Migration Failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrateCertificates();
