package create_assignment.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Security Configuration cho assignment-service.
 * 
 * - Đọc thông tin user từ header (X-User-Id, X-User-Email, X-User-Roles)
 * - Nginx validate JWT qua core-service, sau đó gắn header vào request
 * - Assignment-service chỉ trust những header này từ Nginx
 * - Stateless authentication
 * - Method-level authorization với @PreAuthorize / @Secured
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

        @Autowired(required = false)
        private UserAuthenticationFilter userAuthenticationFilter;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                // CORS: Nginx đã xử lý OPTIONS preflight
                                .cors(Customizer.withDefaults())

                                // Disable CSRF (Stateless API không cần)
                                .csrf(AbstractHttpConfigurer::disable)

                                // Stateless session - phù hợp microservices
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                                // Authorization rules
                                .authorizeHttpRequests(auth -> auth
                                                // Cho phép actuator (health check)
                                                .requestMatchers("/actuator/**").permitAll()

                                                // Tất cả request khác yêu cầu authentication
                                                .anyRequest().authenticated());

                // Thêm custom filter để đọc header X-Auth-*
                if (userAuthenticationFilter != null) {
                        http.addFilterBefore(userAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
                }

                return http.build();
        }

        /**
         * CORS Configuration - Nginx xử lý preflight OPTIONS
         * Spring vẫn cần biết các origin được phép cho actual requests
         */
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();

                configuration.setAllowedOrigins(Arrays.asList(
                                "http://localhost",
                                "http://localhost:80",
                                "http://localhost:3000"));

                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

                // Quan trọng: chứa Authorization header cho JWT
                configuration.setAllowedHeaders(
                                Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With"));

                configuration.setAllowCredentials(true);
                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

        /**
         * Password encoder - dùng cho internal authentication nếu cần (tùy chọn)
         */
        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}