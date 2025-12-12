#!/usr/bin/env node
// Prepare CSVs for fast bulk import into Postgres
// Reads CSVs from ./attached_assets and writes normalized CSVs into ./tmp

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.join(__dirname, '..', 'attached_assets');
const OUT_DIR = path.join(__dirname, '..', 'tmp');
fs.mkdirSync(OUT_DIR, { recursive: true });

function generateValidation(row) {
  const rules = [];
  const type = row['Field Type'] || '';
  const details = row['Options/Other Details'] || '';
  if (type === 'Long Text' && details.includes('min 50 characters')) {
    rules.push({ type: 'minLength', value: 50, message: `${row.Label} must be at least 50 characters` });
  }
  if (type === 'Email') {
    rules.push({ type: 'pattern', value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', message: 'Please enter a valid email address' });
  }
  if (type === 'Phone') {
    rules.push({ type: 'pattern', value: '^[\\d\\s\\+\\-\\(\\)]{10,}$', message: 'Please enter a valid phone number' });
  }
  return rules.length ? rules : null;
}

function writeCsv(filePath, rows, headers) {
  const stream = fs.createWriteStream(filePath, { encoding: 'utf8' });
  stream.write(headers.join(',') + '\n');
  for (const r of rows) {
    const line = headers.map(h => {
      const v = r[h];
      if (v === null || v === undefined) return '';
      // Ensure JSON blobs are stringified and escaped
      if (typeof v === 'object') return '"' + JSON.stringify(v).replace(/"/g, '""') + '"';
      const s = String(v);
      // Escape quotes
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(',');
    stream.write(line + '\n');
  }
  stream.end();
  console.log('Wrote', filePath);
}

async function findFieldCsv() {
  const files = fs.readdirSync(INPUT_DIR);
  const fieldFile = files.find(f => f.toLowerCase().includes('field') && f.endsWith('.csv')) || files.find(f => f.endsWith('.csv'));
  return fieldFile ? path.join(INPUT_DIR, fieldFile) : null;
}

async function run() {
  const fieldCsv = await findFieldCsv();
  if (!fieldCsv) {
    console.error('No field CSV found in', INPUT_DIR);
    process.exit(1);
  }

  const rows = [];
  fs.createReadStream(fieldCsv).pipe(csv()).on('data', (data) => rows.push(data)).on('end', () => {
    console.log('Parsed', rows.length, 'rows from', fieldCsv);

    // Build categories and subcategories maps
    const categoriesMap = new Map();
    const subcategoriesMap = new Map();
    const fieldRows = [];

    for (const row of rows) {
      const categoryName = (row['Category'] || '').trim();
      const subName = (row['Sub Category'] || '').trim();
      if (!categoriesMap.has(categoryName)) {
        categoriesMap.set(categoryName, {
          id: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: categoryName,
          description: `${categoryName} related tickets`,
          icon: '',
          color: '',
          is_active: true,
        });
      }
      const subKey = `${categoryName}||${subName}`;
      if (!subcategoriesMap.has(subKey)) {
        subcategoriesMap.set(subKey, {
          id: subName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          category_id: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: subName,
          description: `${subName} in ${categoryName}`,
          form_fields: [],
          is_active: true,
        });
      }
      const sub = subcategoriesMap.get(subKey);
      const uniqueId = (row['Unique ID'] || '').trim();
      if (uniqueId) sub.form_fields.push(uniqueId);

      // options parse
      const options = row['Options/Other Details'] ? row['Options/Other Details'].split(' | ').map(s => s.trim()).filter(Boolean) : null;
      const validation = generateValidation(row);
      const orderIndex = parseInt((uniqueId || '').split('-')[1]) || 0;

      fieldRows.push({
        id: uniqueId,
        label: row['Label'] || '',
        field_type: row['Field Type'] || '',
        options: options ? options : null,
        sub_category: sub.id,
        category: categoriesMap.get(categoryName).id,
        unique_id: uniqueId,
        description: row['Description'] || '',
        is_required: (row['Is Required'] || '').toLowerCase() === 'yes',
        is_hidden: (row['Is Hidden'] || '').toLowerCase() === 'yes',
        validation: validation,
        order_index: orderIndex,
        is_active: true,
      });
    }

    // Write CSVs
    const categoriesRows = Array.from(categoriesMap.values()).map(c => ({ id: c.id, name: c.name, description: c.description, icon: c.icon, color: c.color, default_department: '', is_active: c.is_active }));
    const subRows = Array.from(subcategoriesMap.values()).map(s => ({ id: s.id, category_id: s.category_id, name: s.name, description: s.description, form_fields: JSON.stringify(s.form_fields), default_department: '', is_active: s.is_active }));

    writeCsv(path.join(OUT_DIR, 'categories.csv'), categoriesRows, ['id','name','description','icon','color','default_department','is_active']);
    writeCsv(path.join(OUT_DIR, 'subcategories.csv'), subRows, ['id','category_id','name','description','form_fields','default_department','is_active']);
    writeCsv(path.join(OUT_DIR, 'form_fields.csv'), fieldRows, ['id','label','field_type','options','sub_category','category','unique_id','description','is_required','is_hidden','validation','order_index','is_active']);

    console.log('Prepared CSVs in', OUT_DIR);
    process.exit(0);
  });
}

run().catch(err => { console.error(err); process.exit(1); });
