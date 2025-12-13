import { createClerkClient } from '@clerk/backend';
import crypto from 'crypto';

// Helper function untuk memverifikasi tanda tangan Lemon Squeezy
const verifySignature = (req: any, secret: string) => {
  const hmac = crypto.createHmac('sha256', secret);
  // Di Vercel, req.body sudah berupa object JSON. 
  // Kita ubah balik jadi string untuk verifikasi hash.
  const digest = Buffer.from(hmac.update(JSON.stringify(req.body)).digest('hex'), 'utf8');
  const signature = Buffer.from(req.headers['x-signature'] as string || '', 'utf8');

  // Cek apakah panjang buffer sama (untuk mencegah timing attack) dan isinya sama
  if (digest.length !== signature.length) return false;
  return crypto.timingSafeEqual(digest, signature);
};

export default async function handler(req: any, res: any) {
  // 1. Hanya terima method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 2. AMBIL SECRET KEY DARI VERCEL ENVIRONMENT
    // Pastikan Anda sudah set variable ini di Dashboard Vercel!
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    
    if (!secret) {
      console.error("LEMONSQUEEZY_WEBHOOK_SECRET is missing in Vercel Env!");
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    // 3. VERIFIKASI TANDA TANGAN (SECURITY CHECK)
    // Jika tanda tangan tidak cocok, tolak request ini.
    if (!verifySignature(req, secret)) {
      console.error("Invalid signature. Request rejected.");
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    // 4. PROSES DATA JIKA VERIFIKASI LOLOS
    if (event.meta.event_name === 'order_created') {
      
      const userEmail = event.data.attributes.user_email;
      console.log(`✅ Verified Payment received for: ${userEmail}`);

      // Inisialisasi Clerk
      // Pastikan CLERK_SECRET_KEY ada di Vercel Env juga
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

      // Cari user di Clerk berdasarkan email pembeli
      const userList = await clerk.users.getUserList({
        emailAddress: [userEmail],
        limit: 1,
      });

      if (userList.data.length > 0) {
        const userId = userList.data[0].id;

        // Update status user jadi Premium
        await clerk.users.updateUserMetadata(userId, {
          publicMetadata: {
            isPremium: true,
            plan: 'lifetime'
          }
        });

        console.log(`User ${userId} upgraded successfully.`);
        return res.status(200).json({ message: 'User upgraded' });
      } else {
        console.warn(`User with email ${userEmail} not found in Clerk.`);
        // Kita tetap return 200 agar Lemon Squeezy tidak mengirim ulang webhook terus menerus
        return res.status(200).json({ message: 'User not found, but webhook received' });
      }
    }

    return res.status(200).json({ message: 'Event ignored' });

  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
