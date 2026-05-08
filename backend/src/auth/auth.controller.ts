import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** Mock recovery flow for MVP — extend with email provider later. */
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return {
      ok: true,
      message: `If an account exists for ${dto.email}, instructions were sent (mock).`,
    };
  }
}
