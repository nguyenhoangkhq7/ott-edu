package fit.iuh.services.impl;

import fit.iuh.models.Account;
import fit.iuh.repositories.AccountRepository;
import fit.iuh.services.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsServiceImpl implements CustomUserDetailsService {

    private final AccountRepository accountRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Account account = accountRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("Khong tim thay nguoi dung: " + username));

        return User.builder()
                .username(account.getEmail())
                .password(account.getPasswordHash())
                .disabled(!account.isActive())
                .authorities(account.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority(role.getName()))
                        .collect(Collectors.toSet()))
                .build();
    }
}
