// Script para eliminar pagos duplicados por usuario/taller/cuota
import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';

async function cleanupPayments() {
  await dbConnect();
  const allPayments = await Payment.find({});
  const seen = new Set();
  const toDelete = [];

  for (const p of allPayments) {
    const key = `${p.user}_${p.workshop}_${p.installmentNumber}`;
    if (seen.has(key)) {
      toDelete.push(p._id);
    } else {
      seen.add(key);
    }
  }

  if (toDelete.length > 0) {
    await Payment.deleteMany({ _id: { $in: toDelete } });
    console.log(`Pagos duplicados eliminados: ${toDelete.length}`);
  } else {
    console.log('No se encontraron pagos duplicados.');
  }
}

cleanupPayments();
