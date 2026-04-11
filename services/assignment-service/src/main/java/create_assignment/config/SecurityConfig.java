package create_assignment.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security Configuration cho assignment-service.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                // 1. Kích hoạt CORS với cấu hình từ bean corsConfigurationSource bên dưới
                                .cors(Customizer.withDefaults())

                                .csrf(AbstractHttpConfigurer::disable)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/actuator/**").permitAll()
                                                .anyRequest().authenticated())
                                .httpBasic(httpBasic -> {
                                }); // Basic Auth cho development/testing

                return http.build();
        }

        /**
         * Cấu hình CORS cho phép localhost:3000 và localhost:8080
         */
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();

                // Cho phép các domain nào gọi tới API này
                configuration.setAllowedOrigins(Arrays.asList(
                                "http://localhost",       // Nginx gateway (port 80 mặc định)
                                "http://localhost:80",    // Nginx gateway (explicit port)
                                "http://localhost:3000",  // Frontend dev trực tiếp
                                "http://localhost:8080")); // Internal

                // Cho phép các HTTP Methods
                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

                // Cho phép các Headers
                configuration.setAllowedHeaders(
                                Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With"));

                // Bắt buộc phải là true nếu Frontend có gửi kèm Cookie/Token (withCredentials =
                // true)
                configuration.setAllowCredentials(true);

                // Cache kết quả preflight trong 1 giờ (giảm tải request OPTIONS)
                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                // Áp dụng cấu hình này cho mọi endpoint
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

        /**
         * User mẫu để test — THAY THẾ bằng JWT trong production.
         */
        @Bean
        public UserDetailsService userDetailsService(PasswordEncoder encoder) {
                return new InMemoryUserDetailsManager(
                                User.builder()
                                                .username("teacher")
                                                .password(encoder.encode("teacher123"))
                                                .roles("TEACHER")
                                                .build(),
                                User.builder()
                                                .username("student")
                                                .password(encoder.encode("student123"))
                                                .roles("STUDENT")
                                                .build());
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}