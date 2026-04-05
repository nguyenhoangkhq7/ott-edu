package fit.iuh;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class CoreServiceApplication {

   public static void main(String[] args) {
      SpringApplication.run(CoreServiceApplication.class, args);
   }

}
