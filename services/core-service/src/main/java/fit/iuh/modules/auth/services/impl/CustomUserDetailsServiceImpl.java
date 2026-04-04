package fit.iuh.modules.auth.services.impl;

import fit.iuh.models.Account;
import fit.iuh.models.AccountStatus;
import fit.iuh.modules.auth.repositories.AccountRepository;
import fit.iuh.modules.auth.services.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Set;

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
                .disabled(account.getStatus() == AccountStatus.APPEAR_OFFLINE)
                .authorities(Set.of(new SimpleGrantedAuthority(account.getRole().name())))
                .build();
    }
}
