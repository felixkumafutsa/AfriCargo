import postgres from "postgres";

const email = process.argv[2]?.trim().toLowerCase();
const databaseUrl = process.env.DATABASE_URL;

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error(
    "Pass the verified Supabase Auth account email: npm run db:seed-superadmin -- admin@example.com",
  );
}

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required in .env.local to seed a platform superadmin.");
}

const sql = postgres(databaseUrl, { max: 1, prepare: false });

try {
  await sql.begin(async (transaction) => {
    await transaction`
      select pg_advisory_xact_lock(hashtext('africargo.platform_superadmin.seed'))
    `;

    const [authUser] = await transaction`
      select id
      from auth.users
      where lower(email) = ${email}
        and email_confirmed_at is not null
      limit 1
      for share
    `;

    if (!authUser) {
      throw new Error(
        `No email-verified Supabase Auth user exists for ${email}. Register and verify that account, then retry.`,
      );
    }

    const admins = await transaction`
      select user_id
      from public.platform_admins
      limit 2
      for update
    `;

    if (admins.length > 0) {
      if (admins.length === 1 && admins[0].user_id === authUser.id) {
        return;
      }

      throw new Error(
        "A different platform superadmin is already seeded; refusing to add another implicitly.",
      );
    }

    await transaction`
      insert into public.platform_admins (user_id, granted_by)
      values (${authUser.id}, ${authUser.id})
    `;
  });

  console.log(`Platform superadmin seed verified for ${email}.`);
} finally {
  await sql.end();
}
