import { PrismaClient } from '@prisma/client';
import { uploadFile } from '../services/s3.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

interface MigrationStats {
  totalFiles: number;
  successfulUploads: number;
  failedUploads: number;
  skippedFiles: number;
  errors: Array<{
    file: string;
    error: string;
  }>;
}

interface FileRecord {
  id: string;
  fileUrl: string;
  fileName: string;
  originalName?: string;
  table: 'ClientDocument' | 'RequirementDocument';
}

/**
 * Get all files from database that need migration
 */
async function getAllFilesToMigrate(): Promise<FileRecord[]> {
  const files: FileRecord[] = [];

  // Get client documents
  const clientDocuments = await prisma.clientDocument.findMany({
    where: {
      fileUrl: {
        startsWith: '/uploads/',
      },
    },
    select: {
      id: true,
      fileUrl: true,
      fileName: true,
      originalName: true,
    },
  });

  files.push(
    ...clientDocuments.map(doc => ({
      id: doc.id,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      originalName: doc.originalName,
      table: 'ClientDocument' as const,
    }))
  );

  // Get requirement documents (if they exist in your schema)
  try {
    const requirementDocuments = await prisma.requirementDocument.findMany({
      where: {
        fileUrl: {
          startsWith: '/uploads/',
        },
      },
      select: {
        id: true,
        fileUrl: true,
      },
    });

    files.push(
      ...requirementDocuments.map(doc => ({
        id: doc.id,
        fileUrl: doc.fileUrl,
        fileName: doc.fileUrl.split('/').pop() || 'unknown',
        originalName: undefined,
        table: 'RequirementDocument' as const,
      }))
    );
  } catch {
    console.log('No RequirementDocument table found, skipping...');
  }

  return files;
}

/**
 * Check if local file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file type from file path
 */
function getFileTypeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

/**
 * Get S3 folder based on file URL
 */
function getS3Folder(
  fileUrl: string
): 'requirement-documents' | 'client-documents' | 'payment-documents' {
  if (fileUrl.includes('client-documents')) {
    return 'client-documents';
  } else if (fileUrl.includes('requirement-documents')) {
    return 'requirement-documents';
  } else if (fileUrl.includes('payment-documents')) {
    return 'payment-documents';
  }
  return 'client-documents'; // Default fallback
}

/**
 * Migrate a single file to S3
 */
async function migrateFile(
  file: FileRecord
): Promise<{ success: boolean; newUrl?: string; error?: string }> {
  try {
    // Construct local file path
    const localFilePath = path.join(
      __dirname,
      '../../uploads',
      file.fileUrl.replace('/uploads/', '')
    );

    // Check if local file exists
    if (!(await fileExists(localFilePath))) {
      return {
        success: false,
        error: `Local file not found: ${localFilePath}`,
      };
    }

    // Read file buffer
    const fileBuffer = await fs.readFile(localFilePath);
    const mimeType = getFileTypeFromPath(file.fileUrl);
    const folder = getS3Folder(file.fileUrl);

    // Upload to S3
    const uploadResult = await uploadFile({
      buffer: fileBuffer,
      originalName: file.originalName || file.fileName,
      mimeType,
      folder,
    });

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error || 'S3 upload failed',
      };
    }

    return {
      success: true,
      newUrl: uploadResult.fileUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update database with new S3 URL
 */
async function updateDatabaseRecord(file: FileRecord, newUrl: string): Promise<boolean> {
  try {
    if (file.table === 'ClientDocument') {
      await prisma.clientDocument.update({
        where: { id: file.id },
        data: { fileUrl: newUrl },
      });
    } else if (file.table === 'RequirementDocument') {
      await prisma.requirementDocument.update({
        where: { id: file.id },
        data: { fileUrl: newUrl },
      });
    }
    return true;
  } catch (error) {
    console.error(`Failed to update database record ${file.id}:`, error);
    return false;
  }
}

/**
 * Create backup of database before migration
 */
async function createBackup(): Promise<void> {
  console.log('📋 Creating backup of file URLs...');

  const clientDocuments = await prisma.clientDocument.findMany({
    where: {
      fileUrl: {
        startsWith: '/uploads/',
      },
    },
    select: {
      id: true,
      fileUrl: true,
      fileName: true,
    },
  });

  const requirementDocuments = await prisma.requirementDocument
    .findMany({
      where: {
        fileUrl: {
          startsWith: '/uploads/',
        },
      },
      select: {
        id: true,
        fileUrl: true,
      },
    })
    .catch(() => []); // Ignore if table doesn't exist

  const backup = {
    timestamp: new Date().toISOString(),
    clientDocuments,
    requirementDocuments,
  };

  const backupPath = path.join(__dirname, '../../../migration-backup.json');
  await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
  console.log(`✅ Backup created: ${backupPath}`);
}

/**
 * Main migration function
 */
export async function migrateFilesToS3(dryRun = false): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalFiles: 0,
    successfulUploads: 0,
    failedUploads: 0,
    skippedFiles: 0,
    errors: [],
  };

  try {
    console.log('🚀 Starting S3 migration...');

    if (!dryRun) {
      await createBackup();
    }

    // Get all files to migrate
    const filesToMigrate = await getAllFilesToMigrate();
    stats.totalFiles = filesToMigrate.length;

    console.log(`📁 Found ${stats.totalFiles} files to migrate`);

    if (stats.totalFiles === 0) {
      console.log('✅ No files to migrate');
      return stats;
    }

    // Process each file
    for (let i = 0; i < filesToMigrate.length; i++) {
      const file = filesToMigrate[i];
      console.log(`\n📄 Processing file ${i + 1}/${filesToMigrate.length}: ${file.fileName}`);

      if (dryRun) {
        console.log(`  DRY RUN: Would migrate ${file.fileUrl}`);
        continue;
      }

      // Migrate file to S3
      const migrationResult = await migrateFile(file);

      if (migrationResult.success && migrationResult.newUrl) {
        // Update database
        const updateSuccess = await updateDatabaseRecord(file, migrationResult.newUrl);

        if (updateSuccess) {
          stats.successfulUploads++;
          console.log(`  ✅ Successfully migrated to: ${migrationResult.newUrl}`);
        } else {
          stats.failedUploads++;
          stats.errors.push({
            file: file.fileName,
            error: 'Database update failed',
          });
          console.log(`  ❌ S3 upload successful but database update failed`);
        }
      } else {
        stats.failedUploads++;
        stats.errors.push({
          file: file.fileName,
          error: migrationResult.error || 'Unknown error',
        });
        console.log(`  ❌ Migration failed: ${migrationResult.error}`);
      }

      // Small delay to avoid overwhelming S3
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Migration Summary:');
    console.log(`  Total files: ${stats.totalFiles}`);
    console.log(`  Successful: ${stats.successfulUploads}`);
    console.log(`  Failed: ${stats.failedUploads}`);
    console.log(`  Skipped: ${stats.skippedFiles}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.forEach(error => {
        console.log(`  - ${error.file}: ${error.error}`);
      });
    }

    if (stats.successfulUploads > 0 && !dryRun) {
      console.log('\n🗑️  You can now safely delete the local uploads directory');
      console.log('  But keep the backup file for rollback if needed');
    }
  } catch (error) {
    console.error('💥 Migration failed:', error);
    stats.errors.push({
      file: 'GLOBAL',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    await prisma.$disconnect();
  }

  return stats;
}

/**
 * CLI runner
 */
async function runMigration() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  if (isDryRun) {
    console.log('🔍 Running in DRY RUN mode - no changes will be made\n');
  } else {
    console.log('⚠️  Running in LIVE mode - files will be migrated to S3\n');
    console.log('Press Ctrl+C within 5 seconds to cancel...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const stats = await migrateFilesToS3(isDryRun);

  if (stats.failedUploads > 0) {
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration().catch(console.error);
}
