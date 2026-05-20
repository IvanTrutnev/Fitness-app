import cron from 'node-cron';
import { Balance } from '../models/Balance';
import { NotificationService } from '../services/notificationService';

const WARNING_DAYS = 3;

/**
 * Daily job: notify users whose active balance expires in WARNING_DAYS days
 */
export function startBalanceExpiryWarningJob() {
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('Starting balance expiry warning job...');

      const now = new Date();
      const startOfTargetDay = new Date(now);
      startOfTargetDay.setDate(startOfTargetDay.getDate() + WARNING_DAYS);
      startOfTargetDay.setHours(0, 0, 0, 0);

      const endOfTargetDay = new Date(startOfTargetDay);
      endOfTargetDay.setHours(23, 59, 59, 999);

      const balances = await Balance.find({
        isActive: true,
        visits: { $gt: 0 },
        dueDate: { $gte: startOfTargetDay, $lte: endOfTargetDay },
      });

      let sent = 0;

      for (const balance of balances) {
        const userId = balance.userId.toString();
        const balanceId = balance._id.toString();

        const alreadySent = await NotificationService.hasRecentExpiryWarning(
          userId,
          balanceId,
        );
        if (alreadySent) continue;

        await NotificationService.createBalanceExpiryWarning({
          userId,
          visits: balance.visits,
          dueDate: balance.dueDate,
          balanceId,
          daysLeft: WARNING_DAYS,
        });
        sent++;
      }

      console.log(
        `Balance expiry warning job done: ${sent} notification(s) for ${balances.length} balance(s)`,
      );
    } catch (error) {
      console.error('Error in balance expiry warning job:', error);
    }
  });

  console.log(
    `Balance expiry warning job scheduled (daily at 09:00, ${WARNING_DAYS} days before due date)`,
  );
}
