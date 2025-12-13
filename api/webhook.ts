import { createClerkClient } from '@clerk/backend';
import crypto from 'crypto';
import { buffer } from 'micro'; // Kita pakai ini untuk baca Raw Body

// ⚠️ PENTING: Matikan body parser bawaan Vercel
// Agar kita bisa membaca data mentah untuk verifikasi signature
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("❌ LEMONSQUEEZY_WEBHOOK_SECRET is missing!");
      return res.status(500).json({ error: 'Server config missing' });
    }

    // 1. BACA RAW BODY (BUFFER)
    const rawBody = await buffer(req);
    
    // 2. VERIFIKASI SIGNATURE
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signature = Buffer.from(req.headers['x-signature'] as string || '', 'utf8');

    if (!crypto.timingSafeEqual(digest, signature)) {
      console.error("❌ Invalid signature. Webhook rejected.");
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 3. PARSE JSON SETELAH VERIFIKASI SUKSES
    const event = JSON.parse(rawBody.toString());

    // 4. PROSES LOGIKA BISNIS
    if (event.meta.event_name === 'order_created') {
      const userEmail = event.data.attributes.user_email;
      console.log(`✅ Valid payment received for: ${userEmail}`);

      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

      const userList = await clerk.users.getUserList({
        emailAddress: [userEmail],
        limit: 1,
      });

      if (userList.data.length > 0) {
        const userId = userList.data[0].id;

        await clerk.users.updateUserMetadata(userId, {
          publicMetadata: {
            isPremium: true,
            plan: 'lifetime'
          }
        });

        console.log(`🚀 User ${userId} upgraded to Premium!`);
        return res.status(200).json({ message: 'User upgraded' });
      } else {
        console.warn(`⚠️ User email ${userEmail} not found in Clerk.`);
        return res.status(200).json({ message: 'User not found but webhook received' });
      }
    }

    return res.status(200).json({ message: 'Event ignored' });

  } catch (error) {
    console.error('🔥 Webhook Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
