package fit.iuh.config.security;

import fit.iuh.models.Account;
import fit.iuh.models.AccountStatus;
import fit.iuh.config.security.repositories.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
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
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng: " + username));

        boolean enabled = account.getStatus() != AccountStatus.APPEAR_OFFLINE;

        return new UserPrincipal(
                account.getId(),
                account.getEmail(),
                account.getPasswordHash(),
                Set.of(new SimpleGrantedAuthority(account.getRole().name())),
                enabled);
    }
}
