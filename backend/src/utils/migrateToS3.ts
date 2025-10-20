import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const S3_BASE_URL = 'https://storage.yandexcloud.net/visarun-uploads';

async function updateClientDocuments() {
  console.log('🔄 Updating ClientDocument URLs...');

  const clientDocs = await prisma.clientDocument.findMany({
    where: {
      fileUrl: {
        startsWith: '/uploads/',
      },
    },
    select: {
      id: true,
      fileName: true,
      fileUrl: true,
    },
  });

  console.log(`Found ${clientDocs.length} client documents to update`);

  for (const doc of clientDocs) {
    const newUrl = `${S3_BASE_URL}/client-documents/${doc.fileName}`;

    await prisma.clientDocument.update({
      where: { id: doc.id },
      data: { fileUrl: newUrl },
    });

    console.log(`✅ Updated: ${doc.fileName}`);
  }
}

async function updateOrderPayments() {
  console.log('🔄 Updating OrderPayment URLs...');

  try {
    const payments = await prisma.orderPayment.findMany({
      where: {
        documentUrl: {
          startsWith: '/uploads/',
        },
      },
      select: {
        id: true,
        documentUrl: true,
      },
    });

    console.log(`Found ${payments.length} payment documents to update`);

    for (const payment of payments) {
      if (!payment.documentUrl) continue;

      const fileName = payment.documentUrl.split('/').pop();
      const newUrl = `${S3_BASE_URL}/payment-documents/${fileName}`;

      await prisma.orderPayment.update({
        where: { id: payment.id },
        data: { documentUrl: newUrl },
      });

      console.log(`✅ Updated: ${fileName}`);
    }
  } catch (error) {
    console.log('⚠️  OrderPayment table not found or error occurred:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting URL migration to S3...\n');

    await updateClientDocuments();
    console.log();
    await updateOrderPayments();

    console.log('\n✅ Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
