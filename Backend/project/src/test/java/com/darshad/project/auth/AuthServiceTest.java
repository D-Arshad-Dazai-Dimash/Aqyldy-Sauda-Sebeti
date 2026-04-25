package com.darshad.project.auth;

import com.darshad.project.auth.dto.AuthResponse;
import com.darshad.project.auth.dto.BusinessRegisterRequest;
import com.darshad.project.auth.dto.LoginRequest;
import com.darshad.project.auth.dto.RegisterRequest;
import com.darshad.project.security.jwt.JwtService;
import com.darshad.project.store.Store;
import com.darshad.project.store.StoreRepository;
import com.darshad.project.user.Role;
import com.darshad.project.user.User;
import com.darshad.project.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService")
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock StoreRepository storeRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock PasswordResetTokenRepository passwordResetTokenRepository;

    AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository, passwordEncoder, jwtService, storeRepository,
                refreshTokenRepository, passwordResetTokenRepository,
                30L, 60L
        );
    }

    @Test
    @DisplayName("registerBusiness сохраняет координаты магазина")
    void registerBusiness_savesStoreCoordinates() {
        when(userRepository.existsByEmail("merchant@mail.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        when(storeRepository.save(any(Store.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateToken(anyString(), anyString())).thenReturn("jwt-token");
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var req = new BusinessRegisterRequest(
                "merchant@mail.com",
                "secret123",
                "Merchant",
                "Test Store",
                "Astana",
                "+77010000000",
                "123456789012",
                "08:00-22:00",
                51.1694,
                71.4491
        );

        AuthResponse response = authService.registerBusiness(req);

        assertThat(response.accessToken()).isEqualTo("jwt-token");
        ArgumentCaptor<Store> storeCaptor = ArgumentCaptor.forClass(Store.class);
        verify(storeRepository).save(storeCaptor.capture());
        assertThat(storeCaptor.getValue().getLatitude()).isEqualTo(51.1694);
        assertThat(storeCaptor.getValue().getLongitude()).isEqualTo(71.4491);
    }

    // ===================== REGISTER =====================

    @Nested
    @DisplayName("register")
    class Register {

        @Test
        @DisplayName("успешная регистрация создаёт пользователя и возвращает токены")
        void success() {
            when(userRepository.existsByEmail("test@mail.com")).thenReturn(false);
            when(passwordEncoder.encode("secret123")).thenReturn("hashed");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(UUID.randomUUID());
                return u;
            });
            when(jwtService.generateToken("test@mail.com", "USER")).thenReturn("jwt-token");
            when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var req = new RegisterRequest("test@mail.com", "secret123", "Test User");
            AuthResponse result = authService.register(req);

            assertThat(result.accessToken()).isEqualTo("jwt-token");
            assertThat(result.role()).isEqualTo("USER");
            assertThat(result.refreshToken()).isNotNull();

            ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(captor.capture());
            User saved = captor.getValue();
            assertThat(saved.getEmail()).isEqualTo("test@mail.com");
            assertThat(saved.getName()).isEqualTo("Test User");
            assertThat(saved.getPasswordHash()).isEqualTo("hashed");
            assertThat(saved.getRole()).isEqualTo(Role.USER);
        }

        @Test
        @DisplayName("дублирующий email — бросает исключение")
        void duplicateEmail() {
            when(userRepository.existsByEmail("dup@mail.com")).thenReturn(true);

            var req = new RegisterRequest("dup@mail.com", "secret123", null);

            assertThatThrownBy(() -> authService.register(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("already registered");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("короткий пароль — бросает исключение")
        void shortPassword() {
            when(userRepository.existsByEmail("x@mail.com")).thenReturn(false);

            var req = new RegisterRequest("x@mail.com", "12345", null);

            assertThatThrownBy(() -> authService.register(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("too short");
        }

        @Test
        @DisplayName("email приводится к нижнему регистру")
        void emailLowerCase() {
            when(userRepository.existsByEmail("upper@mail.com")).thenReturn(false);
            when(passwordEncoder.encode(any())).thenReturn("h");
            when(userRepository.save(any())).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(UUID.randomUUID());
                return u;
            });
            when(jwtService.generateToken(anyString(), anyString())).thenReturn("t");
            when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            authService.register(new RegisterRequest("UPPER@MAIL.COM", "secret123", null));

            ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(captor.capture());
            assertThat(captor.getValue().getEmail()).isEqualTo("upper@mail.com");
        }
    }

    // ===================== LOGIN =====================

    @Nested
    @DisplayName("login")
    class Login {

        User existingUser;

        @BeforeEach
        void setUp() {
            existingUser = User.builder()
                    .id(UUID.randomUUID())
                    .email("user@mail.com")
                    .passwordHash("hashed-pw")
                    .role(Role.USER)
                    .enabled(true)
                    .build();
        }

        @Test
        @DisplayName("успешный логин возвращает токены")
        void success() {
            when(userRepository.findByEmail("user@mail.com")).thenReturn(Optional.of(existingUser));
            when(passwordEncoder.matches("correct", "hashed-pw")).thenReturn(true);
            when(jwtService.generateToken("user@mail.com", "USER")).thenReturn("access-jwt");
            when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            AuthResponse result = authService.login(new LoginRequest("user@mail.com", "correct"));

            assertThat(result.accessToken()).isEqualTo("access-jwt");
            assertThat(result.role()).isEqualTo("USER");
        }

        @Test
        @DisplayName("неверный пароль — бросает исключение")
        void wrongPassword() {
            when(userRepository.findByEmail("user@mail.com")).thenReturn(Optional.of(existingUser));
            when(passwordEncoder.matches("wrong", "hashed-pw")).thenReturn(false);

            assertThatThrownBy(() -> authService.login(new LoginRequest("user@mail.com", "wrong")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid credentials");
        }

        @Test
        @DisplayName("несуществующий пользователь — бросает исключение")
        void userNotFound() {
            when(userRepository.findByEmail("ghost@mail.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(new LoginRequest("ghost@mail.com", "pw")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid credentials");
        }

        @Test
        @DisplayName("отключённый пользователь — бросает исключение")
        void disabledUser() {
            existingUser.setEnabled(false);
            when(userRepository.findByEmail("user@mail.com")).thenReturn(Optional.of(existingUser));

            assertThatThrownBy(() -> authService.login(new LoginRequest("user@mail.com", "correct")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("disabled");
        }
    }

    // ===================== LOGOUT =====================

    @Nested
    @DisplayName("logout")
    class Logout {

        @Test
        @DisplayName("рабочий refresh token помечается revoked")
        void revokesToken() {
            RefreshToken stored = RefreshToken.builder()
                    .user(User.builder().id(UUID.randomUUID()).build())
                    .revoked(false)
                    .build();

            // sha256 of "my-refresh-token"
            when(refreshTokenRepository.findByTokenHash(anyString()))
                    .thenReturn(Optional.of(stored));

            authService.logout("my-refresh-token");

            assertThat(stored.isRevoked()).isTrue();
        }

        @Test
        @DisplayName("null/blank token — молча ничего не делает")
        void nullTokenNoOp() {
            authService.logout(null);
            authService.logout("  ");
            verifyNoInteractions(refreshTokenRepository);
        }
    }

    // ===================== FORGOT PASSWORD =====================

    @Nested
    @DisplayName("forgotPassword")
    class ForgotPassword {

        @Test
        @DisplayName("для существующего email возвращает токен")
        void existingEmail() {
            User user = User.builder().id(UUID.randomUUID()).email("a@b.com").build();
            when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));
            when(passwordResetTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            String token = authService.forgotPassword("a@b.com");

            assertThat(token).isNotNull().isNotBlank();
            verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        }

        @Test
        @DisplayName("несуществующий email — возвращает null без ошибки")
        void unknownEmailReturnsNull() {
            when(userRepository.findByEmail("nobody@b.com")).thenReturn(Optional.empty());

            String token = authService.forgotPassword("nobody@b.com");

            assertThat(token).isNull();
            verifyNoInteractions(passwordResetTokenRepository);
        }
    }
}
