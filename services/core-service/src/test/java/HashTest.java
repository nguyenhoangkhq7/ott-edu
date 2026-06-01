import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashTest {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println("123456: " + encoder.matches("123456", "$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m"));
        System.out.println("12345678: " + encoder.matches("12345678", "$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m"));
        System.out.println("password: " + encoder.matches("password", "$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m"));
        System.out.println("admin: " + encoder.matches("admin", "$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m"));
        System.out.println("Password@123: " + encoder.matches("Password@123", "$2a$10$slYQmyNdGzin7olVN3P5Be7DfH0Al30vxYeVxNLn76wr5UWkmS44m"));
        System.out.println("HASH for '123456': " + encoder.encode("123456"));
    }
}
