import { hashPassword } from 'better-auth/crypto';
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

/**
 *
  Run locally:

  pnpm db:seed-admin

  It prompts for email/name (with defaults) and a hidden password plus confirmation. Re-running it updates the user’s
  name, password, and ensures the admin role.

  For remote D1:

  pnpm db:seed-admin -- --remote --email admin@example.com --name Admin
 */

const DEFAULT_EMAIL = 'admin@example.com';
const DEFAULT_NAME = 'Admin';

const { values } = parseArgs({
    options: {
        email: { type: 'string' },
        name: { type: 'string' },
        remote: { type: 'boolean', default: false },
    },
});

const prompt = (question, defaultValue) =>
    new Promise((resolve) => {
        process.stdout.write(
            `${question}${defaultValue ? ` [${defaultValue}]` : ''}: `
        );

        process.stdin.setEncoding('utf8');
        process.stdin.once('data', (input) => {
            const value = input.trim();
            resolve(value || defaultValue);
        });
        process.stdin.resume();
    });

const promptForPassword = (question) =>
    new Promise((resolve, reject) => {
        if (!process.stdin.isTTY) {
            reject(
                new Error('A TTY is required to enter a password securely.')
            );
            return;
        }

        let password = '';
        process.stdout.write(question);
        process.stdin.setRawMode(true);
        process.stdin.resume();

        const onData = (input) => {
            const key = input.toString();

            if (key === '\u0003') {
                cleanup();
                reject(new Error('Password entry cancelled.'));
                return;
            }

            if (key === '\r' || key === '\n') {
                cleanup();
                process.stdout.write('\n');
                resolve(password);
                return;
            }

            if (key === '\b' || key === '\u007f') {
                password = password.slice(0, -1);
                return;
            }

            password += key;
        };

        const cleanup = () => {
            process.stdin.off('data', onData);
            process.stdin.setRawMode(false);
            process.stdin.pause();
        };

        process.stdin.on('data', onData);
    });

const escapeSql = (value) => value.replaceAll("'", "''");

const main = async () => {
    const email = (
        values.email || (await prompt('Admin email', DEFAULT_EMAIL))
    ).toLowerCase();
    const name = values.name || (await prompt('Admin name', DEFAULT_NAME));

    if (!/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error('Enter a valid admin email address.');
    }

    if (!name) {
        throw new Error('Admin name is required.');
    }

    const password = await promptForPassword('Admin password: ');
    const confirmation = await promptForPassword('Confirm admin password: ');

    if (password.length < 8) {
        throw new Error('The password must be at least 8 characters long.');
    }

    if (password !== confirmation) {
        throw new Error('The passwords do not match.');
    }

    const passwordHash = await hashPassword(password);
    const now = Date.now();
    const sql = `
INSERT INTO user (id, name, email, email_verified, role, created_at, updated_at)
VALUES (lower(hex(randomblob(16))), '${escapeSql(name)}', '${escapeSql(email)}', 1, 'admin', ${now}, ${now})
ON CONFLICT(email) DO UPDATE SET
    name = excluded.name,
    email_verified = 1,
    role = 'admin',
    updated_at = excluded.updated_at;
UPDATE account
SET password = '${escapeSql(passwordHash)}', updated_at = ${now}
WHERE provider_id = 'credential'
    AND user_id = (SELECT id FROM user WHERE email = '${escapeSql(email)}')
    AND account_id = user_id;
INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
SELECT lower(hex(randomblob(16))), id, 'credential', id, '${escapeSql(passwordHash)}', ${now}, ${now}
FROM user
WHERE email = '${escapeSql(email)}'
    AND NOT EXISTS (
        SELECT 1 FROM account
        WHERE provider_id = 'credential'
            AND user_id = user.id
            AND account_id = user.id
    );`;
    const temporaryDirectory = mkdtempSync(
        join(tmpdir(), 'travel-journal-admin-')
    );
    const sqlFile = join(temporaryDirectory, 'seed-admin.sql');

    try {
        writeFileSync(sqlFile, sql);
        execSync(
            `wrangler d1 execute DB ${values.remote ? '--remote' : '--local'} --file="${sqlFile}"`,
            {
                stdio: 'inherit',
                env: { ...process.env },
            }
        );
    } finally {
        rmSync(temporaryDirectory, { force: true, recursive: true });
    }

    console.log(`Admin user ${email} is ready.`);
};

main().catch((error) => {
    console.error(`Unable to seed admin user: ${error.message}`);
    process.exit(1);
});
