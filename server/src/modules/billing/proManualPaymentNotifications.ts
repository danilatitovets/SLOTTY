import { notifyUser } from '../notifications/notifyUser.js';
import { listPlatformAdminProfileIds } from '../notifications/platformAdmins.js';
import {
  proPaymentApprovedForMaster,
  proPaymentRejectedForMaster,
  proPaymentSubmittedForAdmin,
  proPaymentSubmittedForMaster,
} from '../notifications/templates/billingNotificationTemplates.js';

function logProNotifyError(context: string, err: unknown): void {
  console.warn(`[notify] ${context}:`, err instanceof Error ? err.message : err);
}

export async function notifyProPaymentSubmitted(params: {
  masterId: string;
  masterName: string;
  requestId: string;
}): Promise<void> {
  try {
    const masterPayload = proPaymentSubmittedForMaster();
    await notifyUser({
      userId: params.masterId,
      ...masterPayload,
      relatedEntityType: 'pro_manual_payment_request',
      relatedEntityId: params.requestId,
    });

    const adminPayload = proPaymentSubmittedForAdmin(params.masterName);
    const adminIds = await listPlatformAdminProfileIds();
    await Promise.all(
      adminIds.map((adminId) =>
        notifyUser({
          userId: adminId,
          ...adminPayload,
          relatedEntityType: 'pro_manual_payment_request',
          relatedEntityId: params.requestId,
        }),
      ),
    );
  } catch (e) {
    logProNotifyError('notifyProPaymentSubmitted', e);
  }
}

export async function notifyProPaymentApproved(params: {
  masterId: string;
  requestId: string;
  proExpiresAt: Date | string;
}): Promise<void> {
  try {
    const payload = proPaymentApprovedForMaster(params.proExpiresAt);
    await notifyUser({
      userId: params.masterId,
      ...payload,
      relatedEntityType: 'pro_manual_payment_request',
      relatedEntityId: params.requestId,
    });
  } catch (e) {
    logProNotifyError('notifyProPaymentApproved', e);
  }
}

export async function notifyProPaymentRejected(params: {
  masterId: string;
  requestId: string;
  rejectionReason: string;
}): Promise<void> {
  try {
    const payload = proPaymentRejectedForMaster(params.rejectionReason);
    await notifyUser({
      userId: params.masterId,
      ...payload,
      relatedEntityType: 'pro_manual_payment_request',
      relatedEntityId: params.requestId,
    });
  } catch (e) {
    logProNotifyError('notifyProPaymentRejected', e);
  }
}
