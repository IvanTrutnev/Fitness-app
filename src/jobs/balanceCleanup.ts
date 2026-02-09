// src/jobs/balanceCleanup.ts
import cron from 'node-cron';
import { BalanceService } from '../services/balanceService';

/**
 * Cron job for deactivating expired balances
 * Runs daily at 02:00
 */
export function startBalanceCleanupJob() {
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('Starting balance cleanup job...');

      const deactivatedCount = await BalanceService.deactivateExpiredBalances();

      console.log(`Deactivated ${deactivatedCount} expired balances`);
    } catch (error) {
      console.error('Error in balance cleanup job:', error);
    }
  });

  console.log('Balance cleanup job scheduled (daily at 02:00)');
}
