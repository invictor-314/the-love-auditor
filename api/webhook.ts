import { createClerkClient } from '@clerk/backend';

// Ini kode backend yang jalan di server Vercel (bukan di browser user)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Ambil data yang dikirim Lemon Squeezy
    // Karena Vercel memparsing body otomatis, kita perlu raw body untuk verifikasi signature (opsional tapi disarankan)
    // Untuk MVP tahap 2 ini, kita percaya dulu data body-nya
    const event = req.body;

    // Cek apakah ini event "order_created" (pembayaran sukses)
    if (event.meta.event_name === 'order_created') {
      
      // 2. Ambil email user yang bayar
      const userEmail = event.data.attributes.user_email;
      console.log(`Payment received for: ${userEmail}`);

      // 3. Panggil Clerk (Database User)
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

      // Cari user berdasarkan email
      const userList = await clerk.users.getUserList({
        emailAddress: [userEmail],
        limit: 1,
      });

      if (userList.data.length > 0) {
        const userId = userList.data[0].id;

        // 4. UPDATE METADATA USER JADI PREMIUM (PERMANEN)
        await clerk.users.updateUserMetadata(userId, {
          publicMetadata: {
            isPremium: true,
            plan: 'lifetime_299'
          }
        });

        console.log(`User ${userId} upgraded to Premium.`);
        return res.status(200).json({ message: 'User upgraded successfully' });
      } else {
        console.error('User not found in Clerk database');
        return res.status(404).json({ error: 'User not found' });
      }
    }

    return res.status(200).json({ message: 'Event ignored' });

  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
