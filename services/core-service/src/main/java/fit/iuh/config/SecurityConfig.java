package fit.iuh.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // Sử dụng thuật toán BCrypt cực kỳ an toàn
    }

    // Cấu hình phân quyền các endpoint
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Tắt bảo vệ CSRF
                .csrf(csrf -> csrf.disable())

                // Cấu hình quyền truy cập
                .authorizeHttpRequests(auth -> auth
                        // Cho phép bất kỳ ai cũng có thể gọi API có tiền tố /auth/ (gồm register và login)
                        .requestMatchers("/auth/**").permitAll()

                        // Các API khác yêu cầu phải đăng nhập mới được gọi
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}
