import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class AdminService {
  private readonly adminEmail: string;
  private readonly adminPassword: string;

  constructor(
    private jwt: JwtService,
    private supabase: SupabaseService,
    private config: ConfigService,
  ) {
    this.adminEmail = this.config.get<string>('ADMIN_EMAIL') || 'admin@voice2expense.com';
    this.adminPassword = this.config.get<string>('ADMIN_PASSWORD') || '';
  }

  async login(email: string, password: string) {
    if (!this.adminPassword || email !== this.adminEmail || password !== this.adminPassword) {
      throw new UnauthorizedException('Invalid admin credentials');
    }
    const token = this.jwt.sign(
      { sub: 'admin', email, role: 'admin', type: 'access' },
      { expiresIn: '8h' },
    );
    return { access_token: token, role: 'admin' };
  }

  verifyAdmin(token: string) {
    try {
      const payload = this.jwt.verify(token);
      if (payload.role !== 'admin' || payload.email !== this.adminEmail) {
        throw new UnauthorizedException('Not an admin');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired admin token');
    }
  }

  async getStats(filter?: string) {
    const client = this.supabase.getClient();
    const now = new Date();

    // Get all users
    const { data: users, error } = await client
      .from('users')
      .select('id, name, email, last_login_at, preferred_language, created_at');
    if (error) throw new Error(error.message);

    const totalClients = users?.length || 0;

    // Active = logged in within last 30 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeClients = (users || []).filter(
      (u) => u.last_login_at && new Date(u.last_login_at) >= thirtyDaysAgo,
    ).length;
    const inactiveClients = totalClients - activeClients;

    return { totalClients, activeClients, inactiveClients };
  }

  async getClients(filter?: string) {
    const client = this.supabase.getClient();
    const now = new Date();

    // Build date range from filter
    let fromDate: string | null = null;
    if (filter) {
      const d = new Date(now);
      switch (filter) {
        case 'today':
          fromDate = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
          break;
        case 'yesterday': {
          const yStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
          const yEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          // For yesterday, we return users who logged in between yesterday start and today start
          const { data: users } = await client
            .from('users')
            .select('id, name, email, last_login_at, preferred_language, created_at')
            .gte('last_login_at', yStart.toISOString())
            .lt('last_login_at', yEnd.toISOString())
            .order('last_login_at', { ascending: false });
          return this.enrichClients(users || []);
        }
        case 'last_week':
          d.setDate(d.getDate() - 7);
          fromDate = d.toISOString();
          break;
        case 'last_biweek':
          d.setDate(d.getDate() - 14);
          fromDate = d.toISOString();
          break;
        case 'last_month':
          d.setMonth(d.getMonth() - 1);
          fromDate = d.toISOString();
          break;
        default:
          break;
      }
    }

    let qb = client
      .from('users')
      .select('id, name, email, last_login_at, preferred_language, created_at')
      .order('last_login_at', { ascending: false });

    if (fromDate) {
      qb = qb.gte('last_login_at', fromDate);
    }

    const { data: users, error } = await qb;
    if (error) throw new Error(error.message);

    return this.enrichClients(users || []);
  }

  private async enrichClients(
    users: Array<{
      id: string;
      name: string;
      email: string;
      last_login_at: string;
      preferred_language: string;
      created_at: string;
    }>,
  ) {
    const client = this.supabase.getClient();

    // Get expense counts for all users in one query
    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) return [];

    const { data: expenseCounts } = await client
      .from('expenses')
      .select('user_id');

    // Count per user
    const countMap: Record<string, number> = {};
    for (const row of expenseCounts || []) {
      countMap[row.user_id] = (countMap[row.user_id] || 0) + 1;
    }

    return users.map((u, idx) => ({
      client_no: idx + 1,
      name: u.name,
      email: u.email,
      expense_count: countMap[u.id] || 0,
      language: u.preferred_language || 'en',
      last_login_at: u.last_login_at,
      created_at: u.created_at,
    }));
  }
}
