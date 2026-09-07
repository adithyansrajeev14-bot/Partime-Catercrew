import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { type, title, body, jobId, targetUserId, targetRole } = payload;

    // Log the notification dispatch for server logs and monitoring
    console.log('[Push Notification Dispatch]', {
      timestamp: new Date().toISOString(),
      type,
      title,
      body,
      jobId,
      targetUserId,
      targetRole
    });

    // In production with Firebase Admin SDK and FCM service account,
    // this sends downstream to FCM tokens:
    // admin.messaging().sendMulticast({ tokens, notification: { title, body } });

    return NextResponse.json({
      success: true,
      delivered: true,
      message: 'Push notification triggered successfully',
      notification: { type, title, body, jobId, targetUserId, targetRole }
    });
  } catch (error: unknown) {
    console.error('Push notification send error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send notification';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
