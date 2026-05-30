package fit.iuh;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashTest {
    @Test
    public void testHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println("============== NEW HASH ==============");
        System.out.println("CI_PASSWORD: " + encoder.encode("123456"));
        System.out.println("==========================================");
    }
}
