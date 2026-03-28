import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private supabase: SupabaseService,
  ) {}

  async register(email: string, password: string, name: string) {
    const client = this.supabase.getClient();

    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw new UnauthorizedException(authError.message);

    const { error: profileError } = await client
      .from('users')
      .insert({ id: authData.user.id, email, name });

    if (profileError) throw new UnauthorizedException(profileError.message);

    const tokens = this.generateTokens(authData.user.id, email);
    return { user: { id: authData.user.id, email, name }, ...tokens };
  }

  async login(email: string, password: string) {
    const client = this.supabase.getClient();

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new UnauthorizedException('Invalid credentials');

    // Update last_login_at
    await client
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id);

    const { data: profile } = await client
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const tokens = this.generateTokens(data.user.id, email);
    return { user: profile, ...tokens };
  }

  async getProfile(userId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw new UnauthorizedException('User not found');
    return data;
  }

  async googleLogin(supabaseUserId: string, email: string, name: string) {
    const client = this.supabase.getClient();

    // Check if user already exists in our users table
    const { data: existing } = await client
      .from('users')
      .select('*')
      .eq('id', supabaseUserId)
      .maybeSingle();

    if (!existing) {
      // Create user profile
      const { error } = await client
        .from('users')
        .insert({ id: supabaseUserId, email, name });
      if (error) throw new UnauthorizedException(error.message);
    } else {
      // Update last login
      await client
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', supabaseUserId);
    }

    const { data: profile } = await client
      .from('users')
      .select('*')
      .eq('id', supabaseUserId)
      .single();

    const tokens = this.generateTokens(supabaseUserId, email);
    return { user: profile, ...tokens };
  }

  generateTokens(userId: string, email: string) {
    return {
      access_token: this.jwt.sign({ sub: userId, email, type: 'access' }),
      refresh_token: this.jwt.sign({ sub: userId, email, type: 'refresh' }),
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwt.verify(token);
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }
      return this.generateTokens(payload.sub, payload.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
