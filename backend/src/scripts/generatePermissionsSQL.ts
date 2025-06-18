import { PermissionCode } from './PermissionCode.ts';
import fs from 'fs';

const sqlRows = Object.values(PermissionCode).map(code => {
  const name = code
    .split('.')
    .slice(-1)[0]
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase();
  const category = code.split('.')[0];

  return `INSERT INTO permission (code, name, category)
VALUES ('${code}', '${name}', '${category}')
ON CONFLICT (code) DO NOTHING;`;
});

const output = sqlRows.join('\n') + '\n';

fs.writeFileSync('migration/insert-permissions.sql', output);

console.log('✅ SQL для разрешений сгенерирован в migration/insert-permissions.sql');
