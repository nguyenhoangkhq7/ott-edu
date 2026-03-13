package fit.iuh;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(
   properties = {
      "spring.autoconfigure.exclude="
         + "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration,"
         + "org.springframework.boot.jpa.autoconfigure.HibernateJpaAutoConfiguration,"
         + "org.springframework.boot.flyway.autoconfigure.FlywayAutoConfiguration"
   }
)
class CoreServiceApplicationTests {

   @Test
   void contextLoads() {
   }

}
